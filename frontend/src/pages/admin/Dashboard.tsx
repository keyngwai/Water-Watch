import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/shared/Layout';
import { reportsApi, authApi, techniciansApi, getApiError } from '../../services/api';
import { useAuthStore } from '../../context/auth.store';
import { Report, PaginationMeta, ReportStats, STATUS_LABELS, STATUS_COLORS, CATEGORY_LABELS, KENYAN_COUNTIES } from '../../types';

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-reports'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['admin-reports-map'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['admin-stats'], exact: false });
    toast.success('Dashboard refreshed!');
  };

  if (!user) {
    return (
      <Layout title="Admin access required">
        <div style={{ padding: '24px', color: '#64748b', fontSize: '14px' }}>
          Please sign in to access the admin dashboard.
        </div>
      </Layout>
    );
  }

  if (user.role !== 'admin') {
    return (
      <Layout title="Admin access required">
        <div style={{ padding: '24px', color: '#64748b', fontSize: '14px' }}>
          You are signed in as a {user.role}. Admin access is required to view this page.
        </div>
      </Layout>
    );
  }

  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [adminForm, setAdminForm] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    county: '',
    is_root_admin: false,
  });

  const [showUpdateStatus, setShowUpdateStatus] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [updateForm, setUpdateForm] = useState({
    status: '',
    comment: '',
    is_public: false,
    technician_id: '',
  });

  const statsQuery = useQuery<ReportStats>({
    queryKey: ['admin-stats', user?.id, user?.county, user?.is_root_admin],
    queryFn: () => reportsApi.getStats(user?.is_root_admin ? undefined : (user?.county || undefined)),
    enabled: user?.role === 'admin',
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
  });

  const stats = statsQuery.data;
  const statsLoading = statsQuery.isLoading;

  // Show errors via toast (react-query v5 does not support onError callback on queries)
  useEffect(() => {
    if (statsQuery.isError) {
      toast.error(getApiError(statsQuery.error));
    }
  }, [statsQuery.isError, statsQuery.error]);

  const recentReportsQuery = useQuery<{ reports: Report[]; meta: PaginationMeta }>({
    queryKey: ['admin-reports', 'recent', user?.id],
    queryFn: () => reportsApi.adminList({ limit: 8, sort: 'newest' }),
    enabled: user?.role === 'admin',
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
  });

  const recentData = recentReportsQuery.data;

  useEffect(() => {
    if (recentReportsQuery.isError) {
      toast.error(getApiError(recentReportsQuery.error));
    }
  }, [recentReportsQuery.isError, recentReportsQuery.error]);

  const { data: reportTechnicians } = useQuery({
    queryKey: ['technicians', selectedReport?.county],
    queryFn: () => selectedReport ? techniciansApi.list(selectedReport.county) : [],
    enabled: !!selectedReport,
  });

  const createAdminMutation = useMutation({
    mutationFn: authApi.createAdmin,
    onSuccess: () => {
      toast.success('Admin account created successfully!');
      setShowCreateAdmin(false);
      setAdminForm({ email: '', password: '', full_name: '', phone: '', county: '', is_root_admin: false });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string; status: string; comment?: string; is_public: boolean; technician_id?: string }) =>
      reportsApi.updateStatus(data.id, {
        status: data.status as any,
        comment: data.comment,
        is_public: data.is_public,
        technician_id: data.technician_id,
      }),
    onSuccess: () => {
      toast.success('Report updated successfully!');
      setShowUpdateStatus(false);
      setSelectedReport(null);
      setUpdateForm({ status: '', comment: '', is_public: false, technician_id: '' });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-map'], exact: false });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'], exact: false });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const statusMap = Object.fromEntries(
    (stats?.byStatus || []).map((s) => [s.status, parseInt(s.count)])
  );
  const totalReports = Object.values(statusMap).reduce((a, b) => a + b, 0);

  return (
    <Layout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>County Water Authority Dashboard</h1>
          <p style={styles.subtitle}>
            {user?.county ? `${user.county} County` : 'All Counties'} · {new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleRefresh} style={styles.refreshBtn}>
            Refresh
          </button>
          <button onClick={() => setShowCreateAdmin(true)} style={styles.createAdminBtn}>
            Create Admin
          </button>
          <button onClick={() => navigate('/admin/map')} style={styles.mapBtn}>
            View Map
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        {[
          { label: 'Total Reports', value: totalReports, icon: '', color: '#0369a1', bg: '#eff6ff' },
          { label: 'Pending Review', value: statusMap['reported'] || 0, icon: '', color: '#d97706', bg: '#fffbeb' },
          { label: 'In Progress', value: statusMap['in_progress'] || 0, icon: '', color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Resolved', value: statusMap['resolved'] || 0, icon: '', color: '#059669', bg: '#ecfdf5' },
        ].map((kpi) => (
          <div key={kpi.label} style={{ ...styles.kpiCard, background: kpi.bg, borderColor: `${kpi.color}20` }}>
            <div style={styles.kpiIcon}>{kpi.icon}</div>
            <div>
              <div style={{ ...styles.kpiValue, color: kpi.color }}>
                {statsLoading ? '—' : kpi.value.toLocaleString()}
              </div>
              <div style={styles.kpiLabel}>{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.twoCol}>
        {/* Status Breakdown */}
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Reports by Status</h3>
          {stats?.byStatus.map((item) => {
            const count = parseInt(item.count);
            const pct = totalReports ? Math.round((count / totalReports) * 100) : 0;
            const color = STATUS_COLORS[item.status as keyof typeof STATUS_COLORS];
            return (
              <div key={item.status} style={styles.barRow}>
                <span style={{ width: '110px', fontSize: '13px', color: '#475569', fontWeight: 500 }}>
                  {STATUS_LABELS[item.status as keyof typeof STATUS_LABELS]}
                </span>
                <div style={styles.barTrack}>
                  <div style={{ ...styles.barFill, width: `${pct}%`, background: color }} />
                </div>
                <span style={{ width: '40px', textAlign: 'right', fontSize: '13px', color: '#94a3b8' }}>{count}</span>
              </div>
            );
          })}
        </div>

        {/* Top Categories */}
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Top Issue Categories</h3>
          {stats?.byCategory.slice(0, 6).map((item, i) => (
            <div key={item.category} style={styles.categoryRow}>
              <span style={styles.categoryRank}>#{i + 1}</span>
              <span style={{ flex: 1, fontSize: '13px', color: '#0f172a', fontWeight: 500 }}>
                {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS]}
              </span>
              <span style={styles.categoryCount}>{parseInt(item.count).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.twoCol}>
        {/* Reports by County */}
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Reports by County</h3>
          {stats?.byCounty.slice(0, 10).map((item, i) => {
            const count = parseInt(item.count);
            const isUserCounty = user?.county === item.county;
            return (
              <div key={item.county} style={styles.countyRow}>
                <span style={styles.countyRank}>#{i + 1}</span>
                <span style={{
                  flex: 1,
                  fontSize: '13px',
                  color: isUserCounty ? '#0369a1' : '#0f172a',
                  fontWeight: isUserCounty ? 600 : 500
                }}>
                  {item.county}
                  {isUserCounty && ' (Your County)'}
                </span>
                <span style={styles.countyCount}>{count.toLocaleString()}</span>
              </div>
            );
          })}
        </div>

        {/* Placeholder for future panel */}
        <div style={styles.panel}>
          <h3 style={styles.panelTitle}>Recent Activity</h3>
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
            Activity feed coming soon...
          </div>
        </div>
      </div>

      {/* Recent Reports Table */}
      <div style={styles.panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ ...styles.panelTitle, margin: 0 }}>Recent Reports</h3>
          <button onClick={() => navigate('/admin/reports')} style={styles.viewAllBtn}>
            View all →
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={styles.table}>
            <thead>
              <tr>
                {['Reference', 'Title', 'Category', 'County', 'Status', 'Submitted', ''].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentData?.reports.map((report) => (
                <tr key={report.id} style={styles.tr}>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '12px', color: '#64748b' }}>
                    {report.reference_code}
                  </td>
                  <td style={{ ...styles.td, maxWidth: '200px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>
                      {report.title}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.categoryTag}>
                      {CATEGORY_LABELS[report.category]}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontSize: '13px', color: '#64748b' }}>{report.county}</td>
                  <td style={styles.td}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: 600,
                      background: `${STATUS_COLORS[report.status]}18`,
                      color: STATUS_COLORS[report.status],
                      border: `1px solid ${STATUS_COLORS[report.status]}30`,
                    }}>
                      {STATUS_LABELS[report.status]}
                    </span>
                  </td>
                  <td style={{ ...styles.td, fontSize: '12px', color: '#94a3b8' }}>
                    {new Date(report.created_at).toLocaleDateString('en-KE')}
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setUpdateForm({ status: report.status, comment: '', is_public: false, technician_id: '' });
                        setShowUpdateStatus(true);
                      }}
                      style={styles.updateBtn}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Admin Modal */}
      {showCreateAdmin && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateAdmin(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Create New Admin Account</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createAdminMutation.mutate(adminForm);
              }}
            >
              <label style={styles.label}>Full Name *</label>
              <input
                id="create-admin-full_name"
                name="full_name"
                style={styles.input}
                type="text"
                value={adminForm.full_name}
                onChange={(e) => setAdminForm((f) => ({ ...f, full_name: e.target.value }))}
                required
              />

              <label style={styles.label}>Email Address *</label>
              <input
                id="create-admin-email"
                name="email"
                style={styles.input}
                type="email"
                value={adminForm.email}
                onChange={(e) => setAdminForm((f) => ({ ...f, email: e.target.value }))}
                required
              />

              <label style={styles.label}>Phone Number</label>
              <input
                id="create-admin-phone"
                name="phone"
                style={styles.input}
                type="tel"
                value={adminForm.phone}
                onChange={(e) => setAdminForm((f) => ({ ...f, phone: e.target.value }))}
              />

              <label style={styles.label}>County{!adminForm.is_root_admin ? ' *' : ''}</label>
              <select
                id="create-admin-county"
                name="county"
                style={styles.input}
                value={adminForm.county}
                onChange={(e) => setAdminForm((f) => ({ ...f, county: e.target.value }))}
                required={!adminForm.is_root_admin}
              >
                <option value="">Select county</option>
                {KENYAN_COUNTIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={adminForm.is_root_admin}
                  onChange={(e) => setAdminForm((f) => ({ ...f, is_root_admin: e.target.checked, county: e.target.checked ? '' : f.county }))}
                />
                Root Admin (can see all counties)
              </label>

              <label style={styles.label}>Password *</label>
              <input
                id="create-admin-password"
                name="password"
                style={styles.input}
                type="password"
                placeholder="Min. 8 characters with uppercase & number"
                value={adminForm.password}
                onChange={(e) => setAdminForm((f) => ({ ...f, password: e.target.value }))}
                required
              />

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowCreateAdmin(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitBtn}
                  disabled={createAdminMutation.isPending}
                >
                  {createAdminMutation.isPending ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {showUpdateStatus && selectedReport && (
        <div style={styles.modalOverlay} onClick={() => setShowUpdateStatus(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>Update Report Status</h3>
            <div style={{ marginBottom: '20px' }}>
              <span style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>
                {selectedReport.reference_code}
              </span>
              <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
                {selectedReport.title}
              </div>
            </div>

            <label style={styles.label}>New Status</label>
            <select
              style={styles.input}
              value={updateForm.status}
              onChange={(e) => setUpdateForm((f) => ({ ...f, status: e.target.value }))}
            >
              <option value="">Select status</option>
              <option value="verified">Verify report</option>
              <option value="in_progress">Mark in progress</option>
              <option value="resolved">Mark resolved</option>
              <option value="rejected">Reject report</option>
            </select>

            {(updateForm.status === 'in_progress' || updateForm.status === 'verified') && (
              <>
                <label style={styles.label}>Assign Technician (optional)</label>
                <select
                  style={styles.input}
                  value={updateForm.technician_id}
                  onChange={(e) => setUpdateForm((f) => ({ ...f, technician_id: e.target.value }))}
                >
                  <option value="">— No assignment —</option>
                  {reportTechnicians?.map((t: any) => (
                    <option key={t.id} value={t.id}>
                      {t.full_name} ({t.employee_id}) — {t.county}
                      {!t.is_available ? ' [BUSY]' : ''}
                    </option>
                  ))}
                </select>
              </>
            )}

            <label style={styles.label}>Comment (optional)</label>
            <textarea
              style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
              value={updateForm.comment}
              onChange={(e) => setUpdateForm((f) => ({ ...f, comment: e.target.value }))}
              placeholder="Add a comment about this update..."
            />

            <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={updateForm.is_public}
                onChange={(e) => setUpdateForm((f) => ({ ...f, is_public: e.target.checked }))}
              />
              Make this update public (visible to citizen)
            </label>

            <div style={styles.modalActions}>
              <button
                type="button"
                onClick={() => setShowUpdateStatus(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!updateForm.status) {
                    toast.error('Please select a status');
                    return;
                  }
                  updateStatusMutation.mutate({
                    id: selectedReport.id,
                    status: updateForm.status,
                    comment: updateForm.comment || undefined,
                    is_public: updateForm.is_public,
                    technician_id: updateForm.technician_id || undefined,
                  });
                }}
                style={styles.submitBtn}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? 'Updating...' : 'Update Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '28px',
  },
  title: { fontSize: '28px', fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.5px', margin: 0 },
  subtitle: { fontSize: '14px', color: '#64748b', marginTop: '4px' },
  mapBtn: {
    padding: '10px 20px',
    background: '#0369a1',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  createAdminBtn: {
    padding: '10px 20px',
    background: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    padding: '32px',
    width: '100%',
    maxWidth: '480px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#0369a1',
    margin: '0 0 24px',
    textAlign: 'center',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    color: '#0f172a',
    marginBottom: '16px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  cancelBtn: {
    padding: '12px 24px',
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  submitBtn: {
    padding: '12px 24px',
    background: '#0369a1',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px',
  },
  kpiCard: {
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid',
  },
  kpiIcon: { fontSize: '28px' },
  kpiValue: { fontSize: '32px', fontWeight: 800, lineHeight: 1 },
  kpiLabel: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' },
  panel: {
    background: '#1e293b',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #334155',
    marginBottom: '16px',
  },
  panelTitle: { fontSize: '16px', fontWeight: 700, color: '#e2e8f0', marginBottom: '16px' },
  barRow: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' },
  barTrack: { flex: 1, height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '4px', transition: 'width 0.5s ease' },
  categoryRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    borderBottom: '1px solid #334155',
  },
  categoryRank: { fontSize: '12px', color: '#64748b', width: '24px', flexShrink: 0 },
  categoryCount: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#38bdf8',
    background: '#0369a110',
    padding: '2px 8px',
    borderRadius: '20px',
  },
  countyRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 0',
    borderBottom: '1px solid #334155',
  },
  countyRank: { fontSize: '12px', color: '#64748b', width: '24px', flexShrink: 0 },
  countyCount: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#10b981',
    background: '#10b98110',
    padding: '2px 8px',
    borderRadius: '20px',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    padding: '10px 12px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #334155',
  },
  tr: { borderBottom: '1px solid #1e293b' },
  td: { padding: '12px 12px' },
  categoryTag: {
    fontSize: '12px',
    background: '#334155',
    color: '#94a3b8',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  viewBtn: {
    padding: '5px 12px',
    background: '#0369a1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
  },
  viewAllBtn: {
    padding: '6px 14px',
    background: '#334155',
    color: '#94a3b8',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  updateBtn: {
    padding: '4px 12px',
    background: '#0369a1',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '11px',
    fontWeight: 500,
  },
  refreshBtn: {
    padding: '8px 16px',
    background: '#0369a1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
};
