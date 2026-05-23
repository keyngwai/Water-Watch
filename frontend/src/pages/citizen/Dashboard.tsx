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
      {user?.county
        ? `Reporting from ${user.county} County`
        : 'Track and manage your water issue reports'}
    </p>
  </div>

  {/* RIGHT SIDE WRAPPER */}
  <div style={styles.welcomeActions}>
    <button
      onClick={() => navigate('/report/new')}
      style={styles.reportBtn}
    >
      + Report
    </button>
  </div>
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

  {/* RIGHT SIDE WRAPPER */}
  <div style={styles.sectionActions}>
    <button
      onClick={() => navigate('/my-reports')}
      style={styles.viewAll}
    >
      View all →
    </button>
  </div>
</div>

        {isLoading ? (
          <p style={{ color: '#94a3b8' }}>Loading your reports...</p>
        ) : reports.length === 0 ? (
          <div style={styles.emptyState}>
            <h3 style={styles.emptyTitle}>No reports yet</h3>
            <p style={styles.emptyText}>
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
      <div style={styles.infoBox}>
        <div style={styles.infoIcon}>Info</div>
        <div>
          <strong style={styles.infoTitle}>
            How Maji Watch Works
          </strong>
          <p style={styles.infoText}>
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
    alignItems: 'center',   //  change from flex-start
    marginBottom: '20px',   // slightly tighter
    gap: '12px',
  },
  welcomeTitle: { fontSize: '30px', fontWeight: 800, color: 'var(--text-color)', margin: 0, letterSpacing: '-0.5px' },
  welcomeText: { fontSize: '14px', color: 'var(--muted-text)', marginTop: '4px' },
  reportBtn: {
    padding: '6px 10px',        // 🔥 smaller padding
    background: '#0369a1',
    color: 'white',
  
    border: 'none',
    borderRadius: '8px',
  
    cursor: 'pointer',
    fontSize: '12px',           // 🔥 smaller text
    fontWeight: 600,
  
    lineHeight: '1',
    height: '30px',             // 🔥 forces compact size
  
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
  statLabel: { fontSize: '13px', color: 'var(--muted-text)', marginTop: '4px' },
  section: { marginBottom: '24px' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  sectionTitle: { fontSize: '20px', fontWeight: 700, color: 'var(--text-color)', margin: 0 },
  sectionActions: {
    display: 'flex',
    alignItems: 'center',
  },
  viewAll: {
    padding: '10px 24px',
    background: 'color-mix(in srgb, var(--accent-color), transparent 90%)',
    border: '1px solid color-mix(in srgb, var(--accent-color), transparent 80%)',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    color: 'var(--accent-color)',
    fontWeight: 600,
  },
  reportGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  infoBox: {
    display: 'flex',
    gap: '16px',
    padding: '20px',
    background: 'var(--bg-color)',
    border: '1px solid var(--border-color)',
    borderRadius: '16px',
    alignItems: 'center',
  },
  infoIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'color-mix(in srgb, var(--accent-color), transparent 90%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    color: 'var(--accent-color)',
  },
  infoTitle: { color: 'var(--text-color)', display: 'block', marginBottom: '4px', fontWeight: 700 },
  infoText: { color: 'var(--muted-text)', fontSize: '13px', margin: 0 },
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    background: 'var(--card-bg)',
    borderRadius: '24px',
    border: '2px dashed var(--border-color)',
  },
  emptyTitle: { color: 'var(--text-color)', margin: '0 0 8px', fontWeight: 700 },
  emptyText: { color: 'var(--muted-text)', fontSize: '14px', marginBottom: '20px' },
};

// Responsive adjustments for mobile
if (window.innerWidth <= 700) {
  styles.welcome.flexDirection = 'column';
  styles.statsRow.gridTemplateColumns = '1fr 1fr';
  styles.reportGrid.gridTemplateColumns = '1fr';
  styles.emptyState.padding = '32px 10px';
  styles.infoBox.flexDirection = 'column';
  styles.infoBox.padding = '14px';
}
