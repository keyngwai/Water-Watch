import { ReportStatus, IssueCategory, SeverityLevel, STATUS_LABELS, CATEGORY_LABELS, STATUS_COLORS, SEVERITY_COLORS } from '../../types';

export function StatusBadge({ status }: { status: ReportStatus }) {
  const color = STATUS_COLORS[status];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 10px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      background: `color-mix(in srgb, ${color}, transparent 85%)`,
      color: color,
      border: `1px solid color-mix(in srgb, ${color}, transparent 70%)`,
      letterSpacing: '0.2px',
      textTransform: 'uppercase',
    }}>
      <span style={{
        width: '6px', height: '6px',
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
      }} />
      {STATUS_LABELS[status]}
    </span>
  );
}

export function CategoryBadge({ category }: { category: IssueCategory }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: 500,
      background: 'var(--bg-color)',
      color: 'var(--text-color)',
      border: '1px solid var(--border-color)',
    }}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: SeverityLevel }) {
  const color = SEVERITY_COLORS[severity];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: '4px',
      fontSize: '11px',
      fontWeight: 700,
      background: `color-mix(in srgb, ${color}, transparent 85%)`,
      color: color,
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
    }}>
      {severity}
    </span>
  );
}

export function ReportCard({
  report,
  onClick,
  compact = false,
  showUpvoteButton = false,
  onUpvote,
}: {
  report: {
    id: string;
    reference_code: string;
    title: string;
    category: IssueCategory;
    severity: SeverityLevel;
    status: ReportStatus;
    county: string;
    location_name: string | null;
    upvote_count: number;
    primary_image?: string | null;
    created_at: string;
    citizen_name?: string;
  };
  onClick?: () => void;
  compact?: boolean;
  showUpvoteButton?: boolean;
  onUpvote?: (id: string) => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card-bg)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        color: 'var(--text-color)',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
      }}
    >
      {report.primary_image && !compact && (
        <img
          src={report.primary_image}
          alt={report.title}
          style={{ width: '100%', height: '160px', objectFit: 'cover' }}
        />
      )}
      <div style={{ padding: compact ? '12px 16px' : '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <StatusBadge status={report.status} />
            {!compact && <SeverityBadge severity={report.severity} />}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--muted-text)', flexShrink: 0, fontFamily: 'monospace' }}>
            {report.reference_code}
          </span>
        </div>

        <h3 style={{
          fontSize: compact ? '14px' : '15px',
          fontWeight: 600,
          color: 'var(--text-color)',
          marginBottom: '6px',
          lineHeight: '1.4',
        }}>
          {report.title}
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          <CategoryBadge category={report.category} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
            {report.location_name || report.county}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted-text)' }}>
              {report.upvote_count} upvotes
            </span>
            {showUpvoteButton && onUpvote && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpvote(report.id);
                }}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid var(--accent-color)',
                  background: 'transparent',
                  color: 'var(--accent-color)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-color)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-color)';
                }}
              >
                Upvote
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
