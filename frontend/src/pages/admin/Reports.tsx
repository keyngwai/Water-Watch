import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/shared/Layout';
import { StatusBadge, CategoryBadge, SeverityBadge } from '../../components/shared/Badges';
import { reportsApi, techniciansApi, getApiError } from '../../services/api';
import { useAuthStore } from '../../context/auth.store';
import { Report, ReportStatus, STATUS_LABELS } from '../../types';

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: 'verified', label: '✓ Verify Report' },
  { value: 'in_progress', label: '🔧 Mark In Progress' },
  { value: 'resolved', label: '✅ Mark Resolved' },
  { value: 'rejected', label: '✗ Reject Report' },
];

function UpdateStatusModal({
  report,
  onClose,
  onSuccess,
}: {
  report: Report;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [newStatus, setNewStatus] = useState<ReportStatus | ''>('');
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [technicianId, setTechnicianId] = useState('');

  const { data: technicians } = useQuery({
    queryKey: ['technicians'],
    queryFn: () => techniciansApi.list(),
  });

  const mutation = useMutation({
    mutationFn: () => reportsApi.updateStatus(report.id, {
      status: newStatus as ReportStatus,
      comment: comment || undefined,
      is_public: isPublic,
      technician_id: technicianId || undefined,
    }),
    onSuccess: () => {
      toast.success(`Report updated to "${STATUS_LABELS[newStatus as ReportStatus]}"`);
      onSuccess();
      onClose();
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={{ color: '#e2e8f0', margin: 0, fontSize: '18px' }}>Update Report Status</h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.modalRef}>
          <span style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace' }}>
            {report.reference_code}
          </span>
          <StatusBadge status={report.status} />
        </div>
        <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px' }}>{report.title}</p>

        <label style={styles.label}>New Status</label>
        <div style={styles.statusOptions}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setNewStatus(opt.value)}
              style={{
                ...styles.statusOpt,
                borderColor: newStatus === opt.value ? '#0369a1' : '#334155',
                background: newStatus === opt.value ? '#0369a120' : '#1e293b',
                color: newStatus === opt.value ? '#38bdf8' : '#94a3b8',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {(newStatus === 'in_progress' || newStatus === 'verified') && (
          <>
            <label style={styles.label}>Assign Technician (optional)</label>
            <select
              style={styles.input}
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
            >
              <option value="">— No assignment —</option>
              {technicians?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name} ({t.employee_id}) — {t.county}
                  {!t.is_available ? ' [BUSY]' : ''}
                </option>
              ))}
            </select>
          </>
        )}

        <label style={styles.label}>Admin Comment</label>
        <textarea
          style={{ ...styles.input, minHeight: '90px', resize: 'vertical' }}
          placeholder="Add a note about this update..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <span>Make this comment visible to the citizen</span>
        </label>

        <div style={styles.modalActions}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!newStatus || mutation.isPending}
            style={{ ...styles.saveBtn, opacity: !newStatus ? 0.5 : 1 }}
          >
            {mutation.isPending ? 'Saving...' : 'Update Status'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminReports() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const [filters, setFilters] = useState({ status: '', category: '', county: '', page: 1 });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-reports', filters],
    queryFn: () => reportsApi.adminList({ ...filters, limit: 25 }),
    enabled: user?.role === 'admin',
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-reports'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['admin-reports-map'], exact: false });
    toast.success('Reports refreshed!');
  };

  const setFilter = (key: string, val: string) => setFilters((f) => ({ ...f, [key]: val, page: 1 }));

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

  if (isError) {
    return (
      <Layout title="All Reports">
        <div style={{ padding: '24px', color: '#f87171', fontSize: '14px' }}>
          Failed to load reports: {(error as any)?.message || 'Unknown error'}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="All Reports">
      {selectedReport && (
        <UpdateStatusModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['admin-reports-map'], exact: false });
          }}
        />
      )}

      {/* Filters */}
      <div style={styles.filters}>
        <select style={styles.filterSelect} value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <input
          style={styles.filterInput}
          placeholder="Filter by county..."
          value={filters.county}
          onChange={(e) => setFilter('county', e.target.value)}
        />
        <button onClick={handleRefresh} style={styles.refreshBtn}>
          🔄 Refresh
        </button>
        <span style={{ color: '#64748b', fontSize: '13px', marginLeft: 'auto' }}>
          {data?.meta.total ?? 0} reports
        </span>
      </div>

      {/* Reports Table */}
      <div style={styles.tableContainer}>
        {isLoading ? (
          <div style={styles.loading}>Loading reports...</div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                {['Ref #', 'Title', 'Category', 'Severity', 'Location', 'Citizen', 'Assigned To', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} style={styles.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.reports.map((report) => (
                <tr key={report.id} style={styles.row}>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>
                    {report.reference_code}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{ fontSize: '13px', fontWeight: 500, color: '#e2e8f0', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => navigate(`/reports/${report.id}`)}
                    >
                      {report.title.length > 40 ? report.title.substring(0, 40) + '...' : report.title}
                    </span>
                  </td>
                  <td style={styles.td}><CategoryBadge category={report.category} /></td>
                  <td style={styles.td}><SeverityBadge severity={report.severity} /></td>
                  <td style={{ ...styles.td, fontSize: '12px', color: '#94a3b8' }}>
                    {report.county}{report.sub_county ? `, ${report.sub_county}` : ''}
                  </td>
                  <td style={{ ...styles.td, fontSize: '12px', color: '#94a3b8' }}>
                    {report.citizen_name || '—'}
                  </td>
                  <td style={{ ...styles.td, fontSize: '12px', color: '#94a3b8' }}>
                    {report.technician_name || <span style={{ color: '#475569' }}>Unassigned</span>}
                  </td>
                  <td style={styles.td}><StatusBadge status={report.status} /></td>
                  <td style={{ ...styles.td, fontSize: '11px', color: '#64748b' }}>
                    {new Date(report.created_at).toLocaleDateString('en-KE')}
                  </td>
                  <td style={styles.td}>
                    <button
                      onClick={() => setSelectedReport(report as unknown as Report)}
                      style={styles.actionBtn}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            disabled={!data.meta.hasPrev}
            onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
            style={{ ...styles.pageBtn, opacity: data.meta.hasPrev ? 1 : 0.4 }}
          >
            ← Prev
          </button>
          <span style={{ color: '#64748b', fontSize: '13px' }}>
            Page {data.meta.page} of {data.meta.totalPages}
          </span>
          <button
            disabled={!data.meta.hasNext}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
            style={{ ...styles.pageBtn, opacity: data.meta.hasNext ? 1 : 0.4 }}
          >
            Next →
          </button>
        </div>
      )}
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  filters: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: '#1e293b',
    color: '#e2e8f0',
    fontSize: '13px',
  },
  filterInput: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: '#1e293b',
    color: '#e2e8f0',
    fontSize: '13px',
  },
  tableContainer: {
    background: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
    overflow: 'auto',
    marginBottom: '16px',
  },
  loading: { padding: '40px', textAlign: 'center', color: '#64748b' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  th: {
    padding: '12px 14px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid #334155',
    background: '#0f172a',
    whiteSpace: 'nowrap',
  },
  row: { borderBottom: '1px solid #1e293b60' },
  td: { padding: '12px 14px', verticalAlign: 'middle' },
  actionBtn: {
    padding: '5px 12px',
    background: '#0369a1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  pagination: { display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  pageBtn: {
    padding: '8px 16px',
    background: '#1e293b',
    color: '#e2e8f0',
    border: '1px solid #334155',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  // Modal styles
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#1e293b',
    borderRadius: '16px',
    border: '1px solid #334155',
    padding: '28px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
    lineHeight: '1',
  },
  modalRef: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' },
  statusOptions: { display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' },
  statusOpt: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1.5px solid',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    textAlign: 'left',
    transition: 'all 0.15s',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #334155',
    background: '#0f172a',
    color: '#e2e8f0',
    fontSize: '13px',
    marginBottom: '16px',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#94a3b8',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  modalActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  cancelBtn: {
    padding: '10px 20px',
    background: '#334155',
    color: '#94a3b8',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  saveBtn: {
    padding: '10px 20px',
    background: '#0369a1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
  },
  refreshBtn: {
    padding: '6px 12px',
    background: '#0369a1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
};
