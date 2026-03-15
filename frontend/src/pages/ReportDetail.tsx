import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { StatusBadge, CategoryBadge, SeverityBadge } from '../components/shared/Badges';
import { reportsApi, getApiError } from '../services/api';
import { useAuthStore } from '../context/auth.store';
import { Report, STATUS_COLORS } from '../types';
import { formatDistanceToNow } from 'date-fns';

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: report, isLoading, refetch } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsApi.getById(id!),
    enabled: !!id,
  });

  const upvoteMutation = useMutation({
    mutationFn: () => reportsApi.upvote(id!),
    onSuccess: () => { toast.success('Vote recorded!'); refetch(); },
    onError: (err) => toast.error(getApiError(err)),
  });

  if (isLoading) {
    return (
      <div style={styles.loadingPage}>
        <div style={styles.spinner}>💧</div>
        <p style={{ color: '#64748b' }}>Loading report...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={styles.loadingPage}>
        <p style={{ color: '#ef4444' }}>Report not found.</p>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Go Back</button>
      </div>
    );
  }

  const r = report as unknown as Report & {
    images: Array<{ id: string; public_url: string; filename: string; is_primary: boolean }>;
    timeline: Array<{ id: string; action_type: string; new_status: string; comment: string | null; admin_name: string; created_at: string }>;
  };

  return (
    <div style={styles.page}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>← Back</button>
        <span style={styles.refCode}>{r.reference_code}</span>
      </div>

      <div style={styles.layout}>
        {/* Main Content */}
        <div style={styles.main}>
          {/* Header */}
          <div style={styles.card}>
            <div style={styles.badgeRow}>
              <StatusBadge status={r.status} />
              <SeverityBadge severity={r.severity} />
              <CategoryBadge category={r.category} />
            </div>
            <h1 style={styles.title}>{r.title}</h1>
            <p style={styles.description}>{r.description}</p>

            <div style={styles.metaGrid}>
              <MetaItem label="📍 Location" value={r.location_name || `${r.county}${r.sub_county ? `, ${r.sub_county}` : ''}`} />
              <MetaItem label="🗺 County" value={r.county} />
              {r.ward && <MetaItem label="🏘 Ward" value={r.ward} />}
              <MetaItem label="📅 Submitted" value={formatDistanceToNow(new Date(r.created_at), { addSuffix: true })} />
              {r.resolved_at && <MetaItem label="✅ Resolved" value={formatDistanceToNow(new Date(r.resolved_at), { addSuffix: true })} />}
              {r.estimated_resolution_date && (
                <MetaItem label="⏰ Est. Resolution" value={new Date(r.estimated_resolution_date).toLocaleDateString('en-KE')} />
              )}
              <MetaItem label="👁 Views" value={String(r.view_count)} />
              <MetaItem label="📍 GPS" value={`${parseFloat(String(r.latitude)).toFixed(5)}, ${parseFloat(String(r.longitude)).toFixed(5)}`} />
            </div>

            {/* Upvote Button (citizens only) */}
            {user?.role === 'citizen' && (
              <button
                onClick={() => upvoteMutation.mutate()}
                disabled={upvoteMutation.isPending}
                style={styles.upvoteBtn}
              >
                👍 Support this report ({r.upvote_count})
              </button>
            )}
          </div>

          {/* Images */}
          {r.images && r.images.length > 0 && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Photos</h3>
              <div style={styles.imageGrid}>
                {r.images.map((img) => (
                  <a key={img.id} href={img.public_url} target="_blank" rel="noopener noreferrer">
                    <img
                      src={img.public_url}
                      alt={img.filename}
                      style={styles.image}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div style={styles.sidebar}>
          {/* Technician */}
          {r.assigned_to && (
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Assigned Technician</h3>
              <div style={styles.techCard}>
                <div style={styles.techIcon}>👷</div>
                <div>
                  <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
                    {(r as unknown as Record<string, unknown>).technician_name as string || 'Technician assigned'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Field Technician</div>
                </div>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div style={styles.card}>
            <h3 style={styles.sectionTitle}>Activity Timeline</h3>
            <div style={styles.timeline}>
              {/* Initial submission */}
              <TimelineItem
                color="#f59e0b"
                label="Report Submitted"
                time={formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
              />
              {r.timeline?.map((action) => (
                <TimelineItem
                  key={action.id}
                  color={STATUS_COLORS[action.new_status as keyof typeof STATUS_COLORS] || '#64748b'}
                  label={`${action.action_type.replace('_', ' ')} by ${action.admin_name}`}
                  comment={action.comment}
                  time={formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '13px', color: '#0f172a' }}>{value}</div>
    </div>
  );
}

function TimelineItem({ color, label, comment, time }: { color: string; label: string; comment?: string | null; time: string }) {
  return (
    <div style={styles.timelineItem}>
      <div style={{ ...styles.timelineDot, background: color }} />
      <div style={styles.timelineContent}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#0f172a' }}>{label}</div>
        {comment && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontStyle: 'italic' }}>"{comment}"</div>}
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>{time}</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  loadingPage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: '12px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  spinner: { fontSize: '48px', animation: 'pulse 1s infinite' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' },
  backBtn: {
    padding: '8px 16px',
    background: 'white',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#475569',
    fontFamily: 'inherit',
  },
  refCode: { fontSize: '13px', fontFamily: 'monospace', color: '#94a3b8' },
  layout: { display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' },
  main: { display: 'flex', flexDirection: 'column', gap: '16px' },
  sidebar: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  badgeRow: { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' },
  title: { fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.3px' },
  description: { fontSize: '15px', color: '#475569', lineHeight: '1.6', margin: '0 0 24px' },
  metaGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '4px', marginBottom: '20px' },
  upvoteBtn: {
    padding: '10px 20px',
    background: '#f0f9ff',
    color: '#0369a1',
    border: '2px solid #bae6fd',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 600,
    fontFamily: 'inherit',
  },
  sectionTitle: { fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: '0 0 16px' },
  imageGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' },
  image: { width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' },
  techCard: { display: 'flex', alignItems: 'center', gap: '12px' },
  techIcon: { fontSize: '28px', background: '#f0fdf4', borderRadius: '50%', padding: '10px' },
  timeline: { display: 'flex', flexDirection: 'column', gap: '16px' },
  timelineItem: { display: 'flex', gap: '12px' },
  timelineDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, marginTop: '4px' },
  timelineContent: { flex: 1 },
};
