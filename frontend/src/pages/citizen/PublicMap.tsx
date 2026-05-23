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

export default function PublicMapView() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['public-reports-map', statusFilter],
    // Limit to 100 reports for public map
    queryFn: () => reportsApi.list({ 
      status: statusFilter || undefined, 
      limit: 100,
      // For citizens, we might want to prioritize their county if logged in
      county: (!statusFilter && user?.county) ? user.county : undefined
    }),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  const reports = data?.reports ?? ([] as Report[]);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['public-reports-map'], exact: false });
    toast.success('Map updated');
  };

  return (
    <Layout title="Community Water Map">
      <div style={styles.controls}>
        <div style={styles.filterGroup}>
          {(['', 'reported', 'in_progress', 'resolved'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                ...styles.filterBtn,
                background: statusFilter === s ? 'var(--accent-color)' : 'var(--card-bg)',
                color: statusFilter === s ? 'white' : 'var(--text-color)',
                borderColor: statusFilter === s ? 'var(--accent-color)' : 'var(--border-color)',
              }}
            >
              {s === '' ? 'All Issues' : STATUS_LABELS[s as keyof typeof STATUS_LABELS]}
            </button>
          ))}
        </div>
        <div style={styles.rightControls}>
          <button onClick={handleRefresh} style={styles.refreshBtn}>
            Refresh
          </button>
          <span style={{ color: 'var(--muted-text)', fontSize: '13px' }}>
            {reports.length} reports nearby
          </span>
        </div>
      </div>

      {isLoading && (
        <div style={{ padding: '12px 16px', color: 'var(--muted-text)', fontSize: '13px' }}>
          Loading community reports...
        </div>
      )}

      {isError && (
        <div style={{ padding: '12px 16px', color: '#f87171', fontSize: '13px' }}>
          Failed to load map data: {(error as any)?.message || 'Unknown error'}
        </div>
      )}

      <div style={styles.mapLayout}>
        <div style={{ flex: 1, minWidth: 0, borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <ReportMap
            reports={reports}
            onReportSelect={setSelectedReport}
            selectedReport={selectedReport}
            height="calc(100vh - 240px)"
          />
        </div>

        {selectedReport && (
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <h3 style={styles.sidebarTitle}>Issue Details</h3>
              <button onClick={() => setSelectedReport(null)} style={styles.closeBtn}>×</button>
            </div>
            
            <div style={styles.refCode}>{selectedReport.reference_code}</div>
            
            <div style={{ marginBottom: '16px' }}>
              <StatusBadge status={selectedReport.status} />
            </div>

            <h4 style={styles.reportTitle}>{selectedReport.title}</h4>
            
            <div style={{ marginBottom: '16px' }}>
              <CategoryBadge category={selectedReport.category} />
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Location</span>
              <span style={styles.detailValue}>
                {selectedReport.location_name || selectedReport.county}
              </span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Community Support</span>
              <span style={styles.detailValue}>
                {selectedReport.upvote_count} upvotes
              </span>
            </div>

            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Reported On</span>
              <span style={styles.detailValue}>
                {new Date(selectedReport.created_at).toLocaleDateString('en-KE', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            </div>

            <button
              onClick={() => navigate(`/reports/${selectedReport.id}`)}
              style={styles.viewBtn}
            >
              Track Progress →
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
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  filterGroup: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  rightControls: { display: 'flex', alignItems: 'center', gap: '12px' },
  filterBtn: {
    padding: '8px 16px',
    borderRadius: '12px',
    border: '1px solid',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 0.2s',
  },
  refreshBtn: {
    padding: '8px 16px',
    background: 'var(--card-bg)',
    color: 'var(--text-color)',
    border: '1px solid var(--border-color)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },
  mapLayout: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
    alignItems: 'stretch',
    minHeight: '60vh',
  },
  sidebar: {
    width: '320px',
    flexShrink: 0,
    background: 'var(--panel-bg)',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    padding: '24px',
    overflowY: 'auto',
    maxHeight: 'calc(100vh - 240px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  sidebarHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sidebarTitle: { color: 'var(--text-color)', margin: 0, fontSize: '18px', fontWeight: 800 },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--muted-text)',
    fontSize: '24px',
    cursor: 'pointer',
    padding: 0,
    lineHeight: 1,
  },
  refCode: { fontSize: '11px', fontFamily: 'monospace', color: 'var(--muted-text)', marginBottom: '8px', textTransform: 'uppercase' },
  reportTitle: { fontSize: '16px', fontWeight: 700, color: 'var(--text-color)', margin: '0 0 16px', lineHeight: '1.4' },
  detailRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid var(--border-color)',
  },
  detailLabel: { fontSize: '12px', color: 'var(--muted-text)', fontWeight: 600, textTransform: 'uppercase' },
  detailValue: { fontSize: '14px', color: 'var(--text-color)', fontWeight: 500 },
  viewBtn: {
    width: '100%',
    padding: '12px',
    background: 'var(--accent-color)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '10px',
    fontSize: '14px',
    transition: 'opacity 0.2s',
  },
};
