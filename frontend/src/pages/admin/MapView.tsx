import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/shared/Layout';
import { ReportMap } from '../../components/shared/Map';
import { StatusBadge, CategoryBadge } from '../../components/shared/Badges';
import { reportsApi } from '../../services/api';
import { useAuthStore } from '../../context/auth.store';
import { Report, STATUS_LABELS } from '../../types';

export default function AdminMapView() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-reports-map', statusFilter, user?.id ?? ''],
    // Limit needs to stay within backend validation (max 100)
    queryFn: () => reportsApi.adminList({ status: statusFilter || undefined, limit: 100 }),
    enabled: user?.role === 'admin',
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 15_000,
  });

  const reports = data?.reports ?? ([] as Report[]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-reports'], exact: false });
    queryClient.invalidateQueries({ queryKey: ['admin-reports-map'], exact: false });
    toast.success('Map refreshed!');
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

  return (
    <Layout title="Map View">
      <div style={styles.controls}>
        <div style={styles.filterGroup}>
          {(['', ...Object.keys(STATUS_LABELS)] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                ...styles.filterBtn,
                background: statusFilter === s ? '#0369a1' : '#1e293b',
                color: statusFilter === s ? 'white' : '#94a3b8',
                borderColor: statusFilter === s ? '#0369a1' : '#334155',
              }}
            >
              {s === '' ? 'All' : STATUS_LABELS[s as keyof typeof STATUS_LABELS]}
              {s !== '' && data && (
                <span style={styles.count}>
                  {reports.filter((r) => r.status === s).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <button onClick={handleRefresh} style={styles.refreshBtn}>
          Refresh
        </button>
        <span style={{ color: '#64748b', fontSize: '13px' }}>
          {reports.length} reports on map
        </span>
      </div>

      {!user?.id && (
        <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>
          Loading user…
        </div>
      )}

      {user?.id && isLoading && (
        <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>
          Loading reports…
        </div>
      )}

      {user?.id && isError && (
        <div style={{ padding: '12px 16px', color: '#f87171', fontSize: '13px' }}>
          Failed to load reports: {(error as any)?.message || 'Unknown error'}
        </div>
      )}

      {user?.id && !isLoading && !isError && reports.length === 0 && (
        <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: '13px' }}>
          No reports found for the selected status.
        </div>
      )}

      <div style={styles.mapLayout}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <ReportMap
            reports={reports}
            onReportSelect={setSelectedReport}
            selectedReport={selectedReport}
            height="calc(100vh - 220px)"
          />
        </div>

        {selectedReport && (
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>Report Detail</h3>
              <button onClick={() => setSelectedReport(null)} style={styles.closeBtn}>×</button>
            </div>
            <div style={styles.refCode}>{selectedReport.reference_code}</div>
            <div style={{ marginBottom: '12px' }}>
              <StatusBadge status={selectedReport.status} />
            </div>
            <h4 style={styles.reportTitle}>{selectedReport.title}</h4>
            <div style={{ marginBottom: '12px' }}>
              <CategoryBadge category={selectedReport.category} />
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Location</span>
              <span style={styles.detailValue}>
                {selectedReport.location_name || `${selectedReport.county}${selectedReport.sub_county ? `, ${selectedReport.sub_county}` : ''}`}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Submitted</span>
              <span style={styles.detailValue}>
                {new Date(selectedReport.created_at).toLocaleDateString('en-KE', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Citizen</span>
              <span style={styles.detailValue}>{selectedReport.citizen_name || '—'}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Upvotes</span>
              <span style={styles.detailValue}>{selectedReport.upvote_count}</span>
            </div>
            {selectedReport.technician_name && (
              <div style={styles.detailRow}>
                <span style={styles.detailLabel}>Assigned</span>
                <span style={styles.detailValue}>{selectedReport.technician_name}</span>
              </div>
            )}
            <button
              onClick={() => navigate(`/reports/${selectedReport.id}`)}
              style={styles.viewBtn}
            >
              View Full Report →
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    flexWrap: 'nowrap',
    overflowX: 'auto',
    gap: '12px',
  },
  filterGroup: { display: 'flex', gap: '8px', flexWrap: 'nowrap' },
  filterBtn: {
    padding: '6px 14px',
    borderRadius: '20px',
    border: '1px solid',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap',
  },
  count: {
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '10px',
    padding: '1px 6px',
    fontSize: '11px',
  },
  mapLayout: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    minHeight: '70vh',
  },
  sidebar: {
    width: '280px',
    flexShrink: 0,
    background: '#1e293b',
    borderRadius: '12px',
    border: '1px solid #334155',
    padding: '20px',
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 220px)',
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sidebarTitle: { color: '#e2e8f0', margin: 0, fontSize: '16px', fontWeight: 700 },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '22px',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  },
  refCode: { fontSize: '11px', fontFamily: 'monospace', color: '#64748b', marginBottom: '8px' },
  reportTitle: { fontSize: '14px', fontWeight: 600, color: '#e2e8f0', margin: '0 0 12px', lineHeight: '1.4' },
  detailRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #334155',
  },
  detailLabel: { fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' },
  detailValue: { fontSize: '13px', color: '#e2e8f0' },
  viewBtn: {
    width: '100%',
    padding: '10px',
    background: '#0369a1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    marginTop: '8px',
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
    whiteSpace: 'nowrap',
  },
};
