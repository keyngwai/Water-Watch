// =========================================================================
// LandingPage.tsx
// =========================================================================
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <div style={ls.page}>
      <nav style={ls.nav}>
        <span style={ls.brand}>Maji Watch</span>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link to="/login" style={ls.navLink}>Citizen Login</Link>
          <Link to="/register" style={{ ...ls.navLink, background: 'var(--accent-color)', color: 'white', borderRadius: '12px', padding: '10px 20px', boxShadow: '0 4px 12px rgba(3, 105, 161, 0.2)' }}>
            Join the Community
          </Link>
        </div>
      </nav>

      <div style={ls.hero}>
        <div style={ls.heroText}>
          <div style={ls.badge}>Serving all 47 Counties</div>
          <h1 style={ls.heroTitle}>Sauti Yako,<br /><span style={{ color: 'var(--accent-color)' }}>Maji Yetu.</span></h1>
          <p style={ls.heroSubtitle}>
            Bridging the gap between Kenyan citizens and county water authorities. 
            Report leaks, shortages, and bursts to ensure every drop counts in your community.
          </p>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/register" style={ls.ctaPrimary}>Report an Issue Now</Link>
            <Link to="/login" style={ls.ctaSecondary}>Authority Dashboard</Link>
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
          { icon: '', title: 'Pinpoint Issues', desc: 'Use our interactive map to drop a pin exactly where the pipe burst or leak is happening.' },
          { icon: '', title: 'Snap & Send', desc: 'Attach photos of the issue. A picture helps our county teams verify and prepare the right tools.' },
          { icon: '', title: 'Stay Updated', desc: 'Get notified as your report moves from "Reported" to "In Progress" and finally "Resolved".' },
          { icon: '', title: 'Fast Dispatch', desc: 'Our system alerts the nearest qualified technician to your location for a speedy fix.' },
          { icon: '', title: 'Open Data', desc: 'Transparency is key. View county-wide trends and see how your authority is performing.' },
          { icon: '', title: 'Private & Secure', desc: 'Your personal details are for the authorities only. We strip GPS metadata from photos for your safety.' },
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
  page: { fontFamily: "'DM Sans', system-ui, sans-serif", background: 'var(--bg-color)', minHeight: '100vh', color: 'var(--text-color)', transition: 'background 0.3s ease' },
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 48px', background: 'var(--nav-bg)', borderBottom: '1px solid var(--border-color)',
    position: 'sticky', top: 0, zIndex: 100,
  },
  brand: { fontSize: '20px', fontWeight: 800, color: 'var(--accent-color)' },
  navLink: { padding: '8px 12px', color: 'var(--muted-text)', textDecoration: 'none', fontSize: '14px', fontWeight: 500 },
  hero: {
    display: 'flex', gap: '48px', padding: '80px 48px', alignItems: 'center',
    maxWidth: '1200px', margin: '0 auto', flexWrap: 'wrap',
  },
  heroText: { flex: 1, minWidth: '300px' },
  badge: {
    display: 'inline-block', padding: '6px 14px',
    background: 'var(--accent-color)', color: 'white', borderRadius: '20px',
    fontSize: '13px', fontWeight: 600, marginBottom: '20px',
    opacity: 0.9,
  },
  heroTitle: { fontSize: '52px', fontWeight: 900, color: 'var(--text-color)', lineHeight: 1.1, margin: '0 0 20px', letterSpacing: '-1.5px' },
  heroSubtitle: { fontSize: '17px', color: 'var(--muted-text)', lineHeight: 1.6, marginBottom: '32px', maxWidth: '520px' },
  ctaPrimary: {
    padding: '14px 28px', background: 'var(--accent-color)', color: 'white',
    borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: 700,
  },
  ctaSecondary: {
    padding: '14px 28px', background: 'transparent', color: 'var(--accent-color)',
    borderRadius: '12px', textDecoration: 'none', fontSize: '15px', fontWeight: 600,
    border: '2px solid var(--accent-color)',
  },
  heroVisual: { display: 'flex', flexDirection: 'column', gap: '0', minWidth: '200px' },
  statCard: {
    background: 'var(--card-bg)', borderRadius: '16px', padding: '20px 28px',
    border: '1px solid var(--border-color)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
  },
  statNum: { fontSize: '28px', fontWeight: 900, color: 'var(--accent-color)', lineHeight: 1 },
  statLabel: { fontSize: '13px', color: 'var(--muted-text)', marginTop: '4px' },
  features: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px', padding: '0 48px 80px', maxWidth: '1200px', margin: '0 auto',
  },
  featureCard: {
    background: 'var(--card-bg)', borderRadius: '16px', padding: '24px',
    border: '1px solid var(--border-color)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  featureIcon: { fontSize: '28px', marginBottom: '12px' },
  featureTitle: { fontSize: '16px', fontWeight: 700, color: 'var(--text-color)', margin: '0 0 8px' },
  featureDesc: { fontSize: '14px', color: 'var(--muted-text)', lineHeight: 1.5, margin: 0 },
  footer: { textAlign: 'center', padding: '24px', color: 'var(--muted-text)', fontSize: '13px', borderTop: '1px solid var(--border-color)' },
};
