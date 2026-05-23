import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/shared/Layout';
import { StatusBadge, CategoryBadge, SeverityBadge } from '../../components/shared/Badges';
import { reportsApi, techniciansApi, getApiError } from '../../services/api';
import { useAuthStore } from '../../context/auth.store';
import { Report, ReportStatus, STATUS_LABELS, CATEGORY_LABELS } from '../../types';

const STATUS_OPTIONS: { value: ReportStatus; label: string }[] = [
  { value: 'verified', label: 'Verify report' },
  { value: 'in_progress', label: 'Mark in progress' },
  { value: 'resolved', label: 'Mark resolved' },
  { value: 'rejected', label: 'Reject report' },
];

function AssignTechnicianModal({
  report,
  onClose,
  onSuccess,
}: {
  report: Report;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Modal state for the selected technician + optional admin note.
  const [technicianId, setTechnicianId] = useState(report.assigned_to ?? '');
  const [comment, setComment] = useState('');
  const [isPublic, setIsPublic] = useState(false);

  const { data: technicians } = useQuery({
    // Load all technicians to avoid county-label mismatch blocking assignment.
    queryKey: ['technicians', 'all-for-assignment'],
    queryFn: () => techniciansApi.list(),
  });

  const mutation = useMutation({
    mutationFn: () => reportsApi.assignTechnician(report.id, {
      technician_id: technicianId,
      comment: comment || undefined,
      is_public: isPublic,
    }),
  });

  const handleAssign = () => {
    mutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Technician assignment updated.');
        onSuccess();
        onClose();
      },
      onError: (err: any) => {
        getApiError(err).then((msg) => toast.error(msg));
      },
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={{ color: 'var(--text-color)', margin: 0, fontSize: '18px' }}>Assign Technician</h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.modalRef}>
          <span style={{ color: 'var(--muted-text)', fontSize: '12px', fontFamily: 'monospace' }}>
            {report.reference_code}
          </span>
          <StatusBadge status={report.status} />
        </div>
        <p style={{ color: 'var(--text-color)', fontSize: '14px', margin: '0 0 20px' }}>{report.title}</p>

        <label style={styles.label}>Technician</label>
        <select
          style={styles.input}
          value={technicianId}
          onChange={(e) => setTechnicianId(e.target.value)}
        >
          <option value="">Select a technician...</option>
          {technicians?.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name}
              {t.job_role ? ` — ${t.job_role}` : ''} ({t.employee_id}) — {t.county}
              {!t.is_available ? ' [BUSY]' : ''}
            </option>
          ))}
        </select>

        <label style={styles.label}>Assignment Note (optional)</label>
        <textarea
          style={{ ...styles.input, minHeight: '90px', resize: 'vertical' }}
          placeholder="Add assignment context for this technician..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />

        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <span>Show note to citizen</span>
        </label>

        <div style={styles.modalActions}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button
            onClick={handleAssign}
            disabled={!technicianId || mutation.isPending}
            style={{ ...styles.saveBtn, opacity: !technicianId ? 0.5 : 1 }}
          >
            {mutation.isPending ? 'Assigning...' : 'Assign Technician'}
          </button>
        </div>
      </div>
    </div>
  );
}

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
  });

  const handleUpdate = () => {
    mutation.mutate(undefined, {
      onSuccess: () => {
        toast.success(`Report updated to "${STATUS_LABELS[newStatus as ReportStatus]}"`);
        onSuccess();
        onClose();
      },
      onError: (err: any) => {
        getApiError(err).then((msg) => toast.error(msg));
      },
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h3 style={{ color: 'var(--text-color)', margin: 0, fontSize: '18px' }}>Update Report Status</h3>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.modalRef}>
          <span style={{ color: 'var(--muted-text)', fontSize: '12px', fontFamily: 'monospace' }}>
            {report.reference_code}
          </span>
          <StatusBadge status={report.status} />
        </div>
        <p style={{ color: 'var(--text-color)', fontSize: '14px', margin: '0 0 20px' }}>{report.title}</p>

        <label style={styles.label}>New Status</label>
        <div style={styles.statusOptions}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setNewStatus(opt.value)}
              style={{
                ...styles.statusOpt,
                borderColor: newStatus === opt.value ? 'var(--accent-color)' : 'var(--border-color)',
                background: newStatus === opt.value ? 'color-mix(in srgb, var(--accent-color), transparent 85%)' : 'var(--card-bg)',
                color: newStatus === opt.value ? 'var(--accent-color)' : 'var(--muted-text)',
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
                  {t.full_name}
                  {t.job_role ? ` — ${t.job_role}` : ''} ({t.employee_id}) — {t.county}
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
            onClick={handleUpdate}
            disabled={!newStatus || mutation.isPending}
            style={{ ...styles.saveBtn, opacity: !newStatus ? 0.5 : 1 }}
          >
            {mutation.isPending ? 'Updating...' : 'Update Status'}
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

  const [filters, setFilters] = useState({ status: '', category: '', county: '', page: 1, start_date: '', end_date: '' });
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [assignmentReport, setAssignmentReport] = useState<Report | null>(null);
  const invalidDateRange = Boolean(filters.start_date && filters.end_date && filters.start_date > filters.end_date);


  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-reports', filters],
    queryFn: () => reportsApi.adminList({
      ...filters,
      status: filters.status || undefined,
      category: filters.category || undefined,
      county: filters.county || undefined,
      start_date: filters.start_date || undefined,
      end_date: filters.end_date || undefined,
      limit: 25,
    }),
    enabled: user?.role === 'admin' && !invalidDateRange,
    refetchInterval: 15_000,
    refetchOnWindowFocus: true,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-reports'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['admin-reports-map'], exact: false });
    toast.success('Reports refreshed!');
  };

  const setFilter = (key: string, val: string) => setFilters((f) => ({ ...f, [key]: val, page: 1 }));
  const setDateFilter = (key: 'start_date' | 'end_date', val: string) => setFilters((f) => ({ ...f, [key]: val, page: 1 }));
  const clearDateFilters = () => setFilters((f) => ({ ...f, start_date: '', end_date: '', page: 1 }));

  if (!user) {
    return (
      <Layout title="Admin access required">
        <div style={{ padding: '24px', color: 'var(--muted-text)', fontSize: '14px' }}>
          Please sign in to access the admin dashboard.
        </div>
      </Layout>
    );
  }

  if (user.role !== 'admin') {
    return (
      <Layout title="Admin access required">
        <div style={{ padding: '24px', color: 'var(--muted-text)', fontSize: '14px' }}>
          You are signed in as a {user.role}. Admin access is required to view this page.
        </div>
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout title="All Reports">
        <div style={{ padding: '24px', color: 'var(--accent-color)', fontSize: '14px' }}>
          Failed to load reports: {(error as any)?.message || 'Unknown error'}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="All Reports">
      <div style={styles.topBar}>
        <h2 style={styles.sectionTitle}>Manage Reports</h2>
      </div>

     {/*
      {/* Date + quick filters 
      <div style={styles.filterCard}>
        <div style={styles.dateFilters}>
          <label style={styles.dateLabel}>
            From
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setDateFilter('start_date', e.target.value)}
              style={styles.dateInput}
            />
          </label>
          <label style={styles.dateLabel}>
            To
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setDateFilter('end_date', e.target.value)}
              style={styles.dateInput}
            />
          </label>
          <button onClick={clearDateFilters} style={styles.clearBtn}>
            Clear dates
          </button>
        </div>
        {invalidDateRange && (
          <div style={styles.errorText}>Start date cannot be after end date.</div>
        )}
      </div> */}
      
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
      {assignmentReport && (
        <AssignTechnicianModal
          report={assignmentReport}
          onClose={() => setAssignmentReport(null)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['admin-reports'], exact: false });
            queryClient.invalidateQueries({ queryKey: ['admin-reports-map'], exact: false });
          }}
        />
      )}

      {/* Filters */}
            <div style={styles.filters}>
        {/* Status */}
        <select
          style={styles.compactSelect}
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
        >
          <option value="">All Status</option>
          {Object.entries(STATUS_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>

        {/* Category */}
        <select
          style={styles.compactSelect}
          value={filters.category}
          onChange={(e) => setFilter('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
            <option key={val} value={val}>
              {label}
            </option>
          ))}
        </select>

        {/* County (Location) */}
        <input
          style={styles.compactInput}
          placeholder="Location"
          value={filters.county}
          onChange={(e) => setFilter('county', e.target.value)}
        />

        {/* From Date */}
        <input
          type="date"
          value={filters.start_date}
          onChange={(e) => setDateFilter('start_date', e.target.value)}
          style={styles.compactInput}
        />

        {/* To Date */}
        <input
          type="date"
          value={filters.end_date}
          onChange={(e) => setDateFilter('end_date', e.target.value)}
          style={styles.compactInput}
        />

        {/* Clear */}
        <button onClick={clearDateFilters} style={styles.compactBtn}>
          Clear
        </button>

        {/* Refresh */}
        <button onClick={handleRefresh} style={styles.compactPrimaryBtn}>
          Refresh
        </button>

        {/* Export CSV */}
        <button
          onClick={async () => {
            try {
              await reportsApi.exportCsv({
                county: filters.county || (user?.is_root_admin ? undefined : (user?.county || undefined)),
                status: filters.status || undefined,
                category: filters.category || undefined,
                start_date: filters.start_date || undefined,
                end_date: filters.end_date || undefined,
              });
              toast.success('CSV export downloaded.');
            } catch (err) {
              const msg = await getApiError(err);
              toast.error(msg);
            }
          }}
          style={styles.compactBtn}
        >
          Export CSV
        </button>

        {/* Export PDF */}
        <button
          onClick={async () => {
            try {
              await reportsApi.exportPdf({
                county: filters.county || (user?.is_root_admin ? undefined : (user?.county || undefined)),
                status: filters.status || undefined,
                category: filters.category || undefined,
                start_date: filters.start_date || undefined,
                end_date: filters.end_date || undefined,
              });
              toast.success('PDF export downloaded.');
            } catch (err) {
              const msg = await getApiError(err);
              toast.error(msg);
            }
          }}
          style={styles.compactBtn}
        >
          Export PDF
        </button>

        {/* Count */}
        <span style={styles.countText}>
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
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '11px', color: 'var(--muted-text)' }}>
                    {report.reference_code}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{ fontSize: '13px', fontWeight: 500, color: 'var(--accent-color)', cursor: 'pointer', textDecoration: 'underline' }}
                      onClick={() => navigate(`/reports/${report.id}`)}
                    >
                      {report.title.length > 40 ? report.title.substring(0, 40) + '...' : report.title}
                    </span>
                  </td>
                  <td style={styles.td}><CategoryBadge category={report.category} /></td>
                  <td style={styles.td}><SeverityBadge severity={report.severity} /></td>
                  <td style={{ ...styles.td, fontSize: '12px', color: 'var(--muted-text)' }}>
                    {report.county}{report.sub_county ? `, ${report.sub_county}` : ''}
                  </td>
                  <td style={{ ...styles.td, fontSize: '12px', color: 'var(--muted-text)' }}>
                    {report.citizen_name || '—'}
                  </td>
                  <td style={{ ...styles.td, fontSize: '12px', color: 'var(--muted-text)' }}>
                    {report.technician_name ? (
                      <div>
                        <div>{report.technician_name}</div>
                        {report.technician_job_role && (
                          <div style={{ fontSize: '10px', color: 'var(--muted-text)', marginTop: '2px' }}>
                            {report.technician_job_role}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--muted-text)', opacity: 0.7 }}>Unassigned</span>
                    )}
                  </td>
                  <td style={styles.td}><StatusBadge status={report.status} /></td>
                  <td style={{ ...styles.td, fontSize: '11px', color: 'var(--muted-text)' }}>
                    {new Date(report.created_at).toLocaleDateString('en-KE')}
                  </td>
                  <td style={styles.td}>
                    {/* Quick actions for this report row */}
                    <div style={styles.actionGroup}>
                      <button
                        onClick={() => setAssignmentReport(report as unknown as Report)}
                        style={styles.assignBtn}
                      >
                        Assign
                      </button>
                      <button
                        onClick={() => setSelectedReport(report as unknown as Report)}
                        style={styles.actionBtn}
                      >
                        Update
                      </button>
                    </div>
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
          <span style={{ color: 'var(--muted-text)', fontSize: '13px' }}>
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
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px',
    gap: '12px',
    flexWrap: 'wrap',
  },
  sectionTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-color)',
    letterSpacing: '-0.5px',
  },
  filterCard: {
    background: 'var(--card-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    padding: '14px',
    marginBottom: '14px',
  },
  dateFilters: {
    display: 'flex',
    gap: '5px',
    alignItems: 'end',
    flexWrap: 'nowrap',
    overflowX: 'auto',
  },
  dateLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    color: 'var(--muted-text)',
    fontSize: '12px',
    fontWeight: 600,
  },
  dateInput: {
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    background: 'var(--input-bg)',
    color: 'var(--text-color)',
    fontSize: '12px',
    minWidth: '130px',
    height: '32px',
  },
  clearBtn: {
    padding: '6px 10px',
    background: 'transparent',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    color: 'var(--muted-text)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    height: '32px',
  },
  errorText: {
    color: '#f87171',
    fontSize: '12px',
    marginTop: '8px',
  },
  filters: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px',
    background: 'var(--card-bg)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    marginBottom: '14px',
  
    flexWrap: 'nowrap',     //  no wrapping
    overflowX: 'auto',      //  scroll if needed
  },
  filterSelect: {
    height: '32px',
    padding: '4px 10px',
    background: 'var(--input-bg)',
    color: 'var(--text-color)',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
  
    width: 'auto',
    flex: '0 0 auto', // 🔥 THIS STOPS STRETCHING
  },
  filterInput: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    background: 'var(--input-bg)',
    color: 'var(--text-color)',
    fontSize: '12px',
    height: '32px',
    width: '150px',
  },
  tableContainer: {
    background: 'var(--panel-bg)',
    borderRadius: '12px',
    border: '1px solid var(--border-color)',
    overflow: 'auto',
    marginBottom: '16px',
  },
  loading: { padding: '40px', textAlign: 'center', color: 'var(--muted-text)' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: '900px' },
  th: {
    padding: '12px 14px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-color)',
    whiteSpace: 'nowrap',
  },
  row: { borderBottom: '1px solid var(--border-color)' },
  td: { padding: '12px 14px', verticalAlign: 'middle', color: 'var(--text-color)' },
  actionBtn: {
    padding: '6px 10px',
    background: '#0369a1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  assignBtn: {
    padding: '6px 10px',
    background: 'var(--panel-bg)',
    color: 'var(--text-color)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  actionGroup: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pagination: { display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center', padding: '16px' },
  pageBtn: {
    padding: '8px 16px',
    background: 'var(--panel-bg)',
    color: 'var(--text-color)',
    border: '1px solid var(--border-color)',
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
    background: 'var(--card-bg)',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
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
    color: 'var(--muted-text)',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '0',
    lineHeight: '1',
  },
  modalRef: { display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '6px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--muted-text)', marginBottom: '8px' },
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
  compactSelect: {
    height: '30px',
    padding: '0 8px',
    fontSize: '12px',
    background: 'var(--input-bg)',
    color: 'var(--text-color)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
  
    width: '140px',
    flex: '0 0 auto',
  },
  compactBtn: {
    height: '30px',
    padding: '0 8px',
    fontSize: '11px',
    borderRadius: '6px',
    border: '1px solid var(--border-color)',
    background: '#0369a1',
    color: 'white',
    cursor: 'pointer',
  
    flex: '0 0 auto',
    whiteSpace: 'nowrap',
    width: 'fit-content',
  },
  compactPrimaryBtn: {
    height: '30px',
    padding: '0 10px',
    fontSize: '11px',
    borderRadius: '6px',
    border: 'none',
    background: '#0369a1',
    color: 'white',
    cursor: 'pointer',
  
    flex: '0 0 auto',
    whiteSpace: 'nowrap',
    width: 'fit-content',
  },
  countText: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: 'var(--muted-text)',
    whiteSpace: 'nowrap',
  },
  compactInput: {
    height: '30px',
    padding: '0 8px',
    fontSize: '12px',
    background: 'var(--input-bg)',
    color: 'var(--text-color)',
    border: '1px solid var(--border-color)',
    borderRadius: '6px',
  
    width: '130px',
    flex: '0 0 auto',
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--input-bg)',
    color: 'var(--text-color)',
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
    color: 'var(--muted-text)',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  modalActions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  cancelBtn: {
    padding: '10px 20px',
    background: 'var(--bg-color)',
    color: 'var(--muted-text)',
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
    padding: '6px 10px',
    background: '#0369a1',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    height: '32px',
    display: 'flex',
    alignItems: 'center',
  },
};

// Responsive adjustments for smaller screens
if (window.innerWidth <= 900) {
  styles.topBar.alignItems = 'stretch';
  styles.sectionTitle.fontSize = '20px';

  styles.filterCard.position = 'sticky';
  styles.filterCard.top = '72px';
  styles.filterCard.zIndex = 20;
  styles.filterCard.background = 'var(--card-bg)';
  styles.filterCard.backdropFilter = 'blur(4px)';

  styles.dateFilters.flexWrap = 'nowrap';
  styles.dateFilters.overflowX = 'auto';
  styles.filters.flexWrap = 'nowrap';
  styles.filters.overflowX = 'auto';

  styles.table.minWidth = '760px';
  styles.th.padding = '10px 10px';
  styles.td.padding = '10px 10px';
  styles.actionGroup.flexDirection = 'row';
  styles.actionGroup.alignItems = 'center';
}
