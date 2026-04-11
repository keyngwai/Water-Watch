// =========================================================================
// LandingPage.tsx
// =========================================================================
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div style={ls.page}>
      <nav style={ls.nav}>
        <span style={ls.brand}>Maji Watch</span>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/login" style={ls.navLink}>Sign In</Link>
          <Link to="/register" style={{ ...ls.navLink, background: '#0369a1', color: 'white', borderRadius: '8px', padding: '8px 16px' }}>
            Get Started
          </Link>
        </div>
      </nav>

      <div style={ls.hero}>
        <div style={ls.heroText}>
          <div style={ls.badge}>Built for Kenya's 47 counties</div>
          <h1 style={ls.heroTitle}>Clean Water.<br />Reported. Verified. Fixed.</h1>
          <p style={ls.heroSubtitle}>
            Maji Watch empowers Kenyan communities to report water access issues
            directly to county water authorities — with full transparency and accountability.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link to="/register" style={ls.ctaPrimary}>Report an Issue</Link>
            <Link to="/login" style={ls.ctaSecondary}>County Authority Login</Link>
          </div>
        </div>
        <div style={ls.heroVisual}>
          <div style={ls.statCard}>
            <div style={ls.statNum}>47</div>
            <div style={ls.statLabel}>Counties Covered</div>
          </div>
          <div style={{ ...ls.statCard, marginTop: '16px' }}>
            <div style={{ ...ls.statNum, color: '#10b981' }}>Real-time</div>
            <div style={ls.statLabel}>Status Tracking</div>
          </div>
          <div style={{ ...ls.statCard, marginTop: '16px' }}>
            <div style={{ ...ls.statNum, color: '#f59e0b' }}>GPS + Photo</div>
            <div style={ls.statLabel}>Evidence Capture</div>
          </div>
        </div>
      </div>

      <div style={ls.features}>
        {[
          { icon: 'Location', title: 'GPS Location', desc: 'Pinpoint the exact location of water issues on an interactive map' },
          { icon: 'Photo', title: 'Photo Evidence', desc: 'Attach photos for faster verification and better documentation' },
          { icon: 'Status', title: 'Status Tracking', desc: 'Follow your report from submission to resolution in real-time' },
          { icon: 'Dispatch', title: 'Technician Dispatch', desc: 'Admins assign qualified technicians directly from the platform' },
          { icon: 'Data', title: 'Data Transparency', desc: 'Public dashboard shows county-wide water issue trends' },
          { icon: 'Secure', title: 'Secure & Private', desc: 'JWT authentication with role-based access control' },
        ].map((f) => (
          <div key={f.title} style={ls.featureCard}>
            <div style={ls.featureIcon}>{f.icon}</div>
            <h3 style={ls.featureTitle}>{f.title}</h3>
            <p style={ls.featureDesc}>{f.desc}</p>
          </div>
        ))}
      </div>

      <footer style={ls.footer}>
        <p>© {new Date().getFullYear()} Maji Watch · Water Access & Quality Monitoring System for Kenya</p>
      </footer>
    </div>
  );
}

const ls: Record<string, React.CSSProperties> = {
  page: { fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f8fafc', minHeight: '100vh' },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 48px', background: 'white', borderBottom: '1px solid #e2e8f0',
    position: 'sticky', top: 0, zIndex: 100,
  },
  brand: { fontSize: '20px', fontWeight: 800, color: '#0369a1' },
  navLink: { padding: '8px 12px', color: '#475569', textDecoration: 'none', fontSize: '14px', fontWeight: 500 },
  hero: {
    display: 'flex', gap: '48px', padding: '80px 48px', alignItems: 'center',
    maxWidth: '1200px', margin: '0 auto', flexWrap: 'wrap',
  },
  heroText: { flex: 1, minWidth: '300px' },
  badge: {
    display: 'inline-block', padding: '6px 14px',
    background: '#eff6ff', color: '#0369a1', borderRadius: '20px',
    fontSize: '13px', fontWeight: 600, marginBottom: '20px',
  },
  heroTitle: { fontSize: '52px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-1.5px' },
  heroSubtitle: { fontSize: '17px', color: '#64748b', lineHeight: 1.6, marginBottom: '32px', maxWidth: '520px' },
  ctaPrimary: {
    padding: '14px 28px', background: '#0369a1', color: 'white',
    borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: 700,
  },
  ctaSecondary: {
    padding: '14px 28px', background: 'white', color: '#0369a1',
    borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: 600,
    border: '2px solid #0369a1',
  },
  heroVisual: { display: 'flex', flexDirection: 'column', gap: '0', minWidth: '200px' },
  statCard: {
    background: 'white', borderRadius: '16px', padding: '20px 28px',
    border: '1px solid #e2e8f0', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
  statNum: { fontSize: '28px', fontWeight: 900, color: '#0369a1', lineHeight: 1 },
  statLabel: { fontSize: '13px', color: '#94a3b8', marginTop: '4px' },
  features: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px', padding: '0 48px 80px', maxWidth: '1200px', margin: '0 auto',
  },
  featureCard: {
    background: 'white', borderRadius: '16px', padding: '24px',
    border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  featureIcon: { fontSize: '28px', marginBottom: '12px' },
  featureTitle: { fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' },
  featureDesc: { fontSize: '14px', color: '#64748b', lineHeight: 1.5, margin: 0 },
  footer: { textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '13px', borderTop: '1px solid #e2e8f0' },
};
