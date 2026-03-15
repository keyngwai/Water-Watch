// =========================================================================
// MyReports.tsx
// =========================================================================
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import { ReportCard } from '../../components/shared/Badges';
import { reportsApi } from '../../services/api';
import { Report, STATUS_LABELS } from '../../types';

export default function MyReports() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['my-reports', status, page],
    queryFn: () => reportsApi.getMyReports({ status: status || undefined, page, limit: 12 }),
  });

  const reports = (data?.reports || []) as unknown as Report[];

  return (
    <Layout title="My Reports">
      <div style={mrStyles.filters}>
        {(['', 'reported', 'verified', 'in_progress', 'resolved', 'rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            style={{
              padding: '7px 16px',
              borderRadius: '20px',
              border: '1.5px solid',
              borderColor: status === s ? '#0369a1' : '#e2e8f0',
              background: status === s ? '#0369a1' : 'white',
              color: status === s ? 'white' : '#64748b',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            {s === '' ? 'All' : STATUS_LABELS[s]}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#94a3b8' }}>
          {data?.meta.total ?? 0} total
        </span>
      </div>

      {isLoading ? (
        <p style={{ color: '#94a3b8', padding: '40px 0' }}>Loading...</p>
      ) : reports.length === 0 ? (
        <div style={mrStyles.empty}>
          <p style={{ color: '#94a3b8' }}>No reports found for this filter.</p>
          <button onClick={() => navigate('/report/new')} style={mrStyles.btn}>
            Submit a Report
          </button>
        </div>
      ) : (
        <div style={mrStyles.grid}>
          {reports.map((r) => (
            <ReportCard key={r.id} report={r} onClick={() => navigate(`/reports/${r.id}`)} />
          ))}
        </div>
      )}

      {data?.meta && data.meta.totalPages > 1 && (
        <div style={mrStyles.pagination}>
          <button disabled={!data.meta.hasPrev} onClick={() => setPage((p) => p - 1)} style={mrStyles.pageBtn}>
            ← Previous
          </button>
          <span style={{ color: '#64748b', fontSize: '13px' }}>
            {data.meta.page} / {data.meta.totalPages}
          </span>
          <button disabled={!data.meta.hasNext} onClick={() => setPage((p) => p + 1)} style={mrStyles.pageBtn}>
            Next →
          </button>
        </div>
      )}
    </Layout>
  );
}

const mrStyles: Record<string, React.CSSProperties> = {
  filters: { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  empty: { textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' },
  btn: { padding: '10px 20px', background: '#0369a1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '12px', fontWeight: 600 },
  pagination: { display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'center', padding: '24px' },
  pageBtn: { padding: '8px 16px', background: 'white', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' },
};
