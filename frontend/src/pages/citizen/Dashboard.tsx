import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/shared/Layout';
import { ReportCard } from '../../components/shared/Badges';
import { reportsApi } from '../../services/api';
import { useAuthStore } from '../../context/auth.store';
import { Report } from '../../types';

export default function CitizenDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['my-reports-preview'],
    queryFn: () => reportsApi.getMyReports({ limit: 6 }),
  });

  const reports = (data?.reports || []) as unknown as Report[];
  const meta = data?.meta;

  const statusSummary = {
    reported: reports.filter((r) => r.status === 'reported').length,
    in_progress: reports.filter((r) => r.status === 'in_progress').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
  };

  return (
    <Layout>
      <div style={styles.welcome}>
        <div>
          <h1 style={styles.welcomeTitle}>
            Hello, {user?.full_name?.split(' ')[0]}
          </h1>
          <p style={styles.welcomeText}>
            {user?.county ? `Reporting from ${user.county} County` : 'Track and manage your water issue reports'}
          </p>
        </div>
        <button onClick={() => navigate('/report/new')} style={styles.reportBtn}>
          + Report Issue
        </button>
      </div>

      {/* Quick Stats */}
      <div style={styles.statsRow}>
        {[
          { label: 'Total Submitted', value: meta?.total ?? 0, color: '#0369a1', bg: '#eff6ff' },
          { label: 'Awaiting Review', value: statusSummary.reported, color: '#d97706', bg: '#fffbeb' },
          { label: 'Being Fixed', value: statusSummary.in_progress, color: '#7c3aed', bg: '#f5f3ff' },
          { label: 'Resolved', value: statusSummary.resolved, color: '#059669', bg: '#ecfdf5' },
        ].map((s) => (
          <div key={s.label} style={{ ...styles.statCard, background: s.bg }}>
            <div style={{ ...styles.statNum, color: s.color }}>{isLoading ? '—' : s.value}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Your Recent Reports</h2>
          <button onClick={() => navigate('/my-reports')} style={styles.viewAll}>
            View all →
          </button>
        </div>

        {isLoading ? (
          <p style={{ color: '#94a3b8' }}>Loading your reports...</p>
        ) : reports.length === 0 ? (
          <div style={styles.empty}>
            <h3 style={{ color: '#475569', margin: '0 0 8px' }}>No reports yet</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              Help your community by reporting water issues in your area.
            </p>
            <button onClick={() => navigate('/report/new')} style={styles.reportBtn}>
              Report Your First Issue
            </button>
          </div>
        ) : (
          <div style={styles.reportGrid}>
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onClick={() => navigate(`/reports/${report.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info Banner */}
      <div style={styles.infoBanner}>
        <div style={{ fontSize: '20px', color: '#0f172a', marginRight: '10px' }}>Info</div>
        <div>
          <strong style={{ color: '#0f172a', display: 'block', marginBottom: '4px' }}>
            How Maji Watch Works
          </strong>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
            After submitting a report, county water authority staff will review and verify it.
            Once verified, a technician is assigned to fix the issue. You'll be able to track
            progress through each stage until resolution.
          </p>
        </div>
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  welcome: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '28px',
  },
  welcomeTitle: { fontSize: '30px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' },
  welcomeText: { fontSize: '14px', color: '#64748b', marginTop: '4px' },
  reportBtn: {
    padding: '10px 20px',
    background: '#0369a1',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 700,
    flexShrink: 0,
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid rgba(0,0,0,0.05)',
  },
  statNum: { fontSize: '32px', fontWeight: 800, lineHeight: 1 },
  statLabel: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  section: { marginBottom: '24px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: 0 },
  viewAll: {
    padding: '6px 14px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#0369a1',
    fontWeight: 600,
  },
  reportGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  empty: {
    textAlign: 'center',
    padding: '60px 40px',
    background: 'white',
    borderRadius: '16px',
    border: '2px dashed #e2e8f0',
  },
  infoBanner: {
    display: 'flex',
    gap: '16px',
    background: '#eff6ff',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #bfdbfe',
    alignItems: 'flex-start',
  },
};

// Responsive adjustments for mobile
if (window.innerWidth <= 700) {
  styles.welcome.flexDirection = 'column';
  styles.statsRow.gridTemplateColumns = '1fr 1fr';
  styles.reportGrid.gridTemplateColumns = '1fr';
  styles.empty.padding = '32px 10px';
  styles.infoBanner.flexDirection = 'column';
  styles.infoBanner.padding = '14px';
}
