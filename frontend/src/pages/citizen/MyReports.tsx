import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/shared/Layout';
import { ReportCard } from '../../components/shared/Badges';
import { reportsApi, getApiError } from '../../services/api';
import { useAuthStore } from '../../context/auth.store';
import { Report, STATUS_LABELS } from '../../types';

export default function MyReports() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<'my-reports' | 'area-reports'>('my-reports');

  const upvoteMutation = useMutation({
    mutationFn: (reportId: string) => reportsApi.upvote(reportId),
    onSuccess: () => {
      toast.success('Report upvoted!');
      queryClient.invalidateQueries({ queryKey: ['area-reports'] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  const handleUpvote = (reportId: string) => {
    upvoteMutation.mutate(reportId);
  };

  const { data: myData, isLoading: myLoading } = useQuery({
    queryKey: ['my-reports', status, page],
    queryFn: () =>
      reportsApi.getMyReports({
        status: status || undefined,
        page,
        limit: 12,
      }),
    enabled: tab === 'my-reports',
  });

  const { data: areaData, isLoading: areaLoading } = useQuery({
    queryKey: ['area-reports', user?.county, page],
    queryFn: () =>
      reportsApi.list({
        county: user?.county || undefined,
        page,
        limit: 12,
      }),
    enabled: tab === 'area-reports' && !!user?.county,
  });

  const reports =
    tab === 'my-reports'
      ? (myData?.reports || [])
      : ((areaData?.reports || []) as unknown as Report[]);

  const isLoading = tab === 'my-reports' ? myLoading : areaLoading;
  const data = tab === 'my-reports' ? myData : areaData;

  return (
    <Layout title="Reports">
      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => {
            setTab('my-reports');
            setPage(1);
            setStatus('');
          }}
          style={{
            ...styles.tabBtn,
            borderBottom:
              tab === 'my-reports' ? '2px solid #0369a1' : '2px solid transparent',
            color: tab === 'my-reports' ? '#0369a1' : '#94a3b8',
          }}
        >
          My Reports
        </button>

        <button
          onClick={() => {
            setTab('area-reports');
            setPage(1);
          }}
          style={{
            ...styles.tabBtn,
            borderBottom:
              tab === 'area-reports' ? '2px solid #0369a1' : '2px solid transparent',
            color: tab === 'area-reports' ? '#0369a1' : '#94a3b8',
          }}
        >
          Area Reports ({user?.county})
        </button>
      </div>

      {/* Filters */}
      {tab === 'my-reports' && (
        <div style={styles.filterBar}>
          {(['', 'reported', 'verified', 'in_progress', 'resolved', 'rejected'] as const).map(
            (s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                style={{
                  ...styles.chip,
                  background: status === s ? '#0369a1' : '#fff',
                  color: status === s ? '#fff' : '#64748b',
                  borderColor: status === s ? '#0369a1' : '#e2e8f0',
                }}
              >
                {s === '' ? 'All' : STATUS_LABELS[s]}
              </button>
            )
          )}

          <span style={styles.count}>
            {data?.meta.total ?? 0} total
          </span>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <p style={styles.loading}>Loading...</p>
      ) : reports.length === 0 ? (
        <div style={styles.empty}>
          <p style={{ color: '#94a3b8' }}>No reports found.</p>
          <button onClick={() => navigate('/report/new')} style={styles.primaryBtn}>
            Submit a Report
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {reports.map((r) => (
            <ReportCard
              key={r.id}
              report={r}
              onClick={() => navigate(`/reports/${r.id}`)}
              showUpvoteButton={tab === 'area-reports'}
              onUpvote={tab === 'area-reports' ? handleUpvote : undefined}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            disabled={!data.meta.hasPrev}
            onClick={() => setPage((p) => p - 1)}
            style={styles.pageBtn}
          >
            ←
          </button>

          <span style={styles.pageText}>
            {data.meta.page} / {data.meta.totalPages}
          </span>

          <button
            disabled={!data.meta.hasNext}
            onClick={() => setPage((p) => p + 1)}
            style={styles.pageBtn}
          >
            →
          </button>
        </div>
      )}
    </Layout>
  );
}

/* ================= CLEAN DESIGN SYSTEM ================= */

const styles: Record<string, React.CSSProperties> = {
  tabs: {
    display: 'flex',
    gap: '12px',
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '16px',
  },

  tabBtn: {
    padding: '5px 8px',
    fontSize: '12px',
    fontWeight: 600,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },

  filterBar: {
    display: 'flex',
    flexWrap: 'nowrap',     // keep single row
    gap: '3px',             // very tight spacing
    alignItems: 'center',
  
    padding: '4px 6px',
    marginBottom: '16px',
  
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
  
    overflow: 'hidden',     // 🚫 NO SCROLL
  },

  chip: {
    flex: '1 1 0',          // 👈 forces all buttons to shrink evenly
    minWidth: 0,            // important for flex shrinking
  
    padding: '3px 4px',     // very tight padding
    fontSize: '10.5px',
    height: '26px',
  
    borderRadius: '8px',    // less pill, more compact
  
    border: '1px solid',
    cursor: 'pointer',
  
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  count: {
    marginLeft: 'auto',
    fontSize: '12px',
    color: '#94a3b8',
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },

  loading: {
    padding: '40px 0',
    color: '#94a3b8',
  },

  empty: {
    textAlign: 'center',
    padding: '60px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },

  primaryBtn: {
    marginTop: '12px',
    padding: '8px 14px',
    fontSize: '13px',
    background: '#0369a1',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
  },

  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
  },

  pageBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    background: 'white',
    cursor: 'pointer',
  },

  pageText: {
    fontSize: '13px',
    color: '#64748b',
  },
};