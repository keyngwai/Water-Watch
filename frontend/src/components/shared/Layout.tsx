import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../context/auth.store';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const CitizenNav = () => {
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const links = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/report/new', label: 'Report Issue' },
    { to: '/my-reports', label: 'My Reports' },
  ];

  return (
    <nav style={styles.nav}>
      <Link to="/dashboard" style={styles.brand}>
        <span style={styles.brandText}>Maji Watch</span>
      </Link>
      <div style={styles.navLinks}>
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            style={{
              ...styles.navLink,
              ...(location.pathname === l.to ? styles.navLinkActive : {}),
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div style={styles.navRight}>
        <span style={styles.userName}>{user?.full_name}</span>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={styles.logoutBtn}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
};

const AdminNav = () => {
  const location = useLocation();
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const links = [
    { to: '/admin', label: 'Overview' },
    { to: '/admin/reports', label: 'Reports' },
    { to: '/admin/map', label: 'Map View' },
    { to: '/admin/technicians', label: 'Technicians' },
  ];

  return (
    <nav style={{ ...styles.nav, background: '#0f172a', borderColor: '#1e293b' }}>
      <Link to="/admin" style={styles.brand}>
        <span style={{ ...styles.brandText, color: '#38bdf8' }}>Maji Watch Admin</span>
      </Link>
      <div style={styles.navLinks}>
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            style={{
              ...styles.navLink,
              color: location.pathname === l.to ? '#38bdf8' : '#94a3b8',
              ...(location.pathname === l.to ? { borderBottom: '2px solid #38bdf8' } : {}),
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <button
        onClick={() => { logout(); navigate('/login'); }}
        style={{ ...styles.logoutBtn, background: '#1e293b', color: '#94a3b8' }}
      >
        Sign out
      </button>
    </nav>
  );
};

export default function Layout({ children, title }: LayoutProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <div style={isAdmin ? styles.adminWrapper : styles.wrapper}>
      {isAdmin ? <AdminNav /> : <CitizenNav />}
      <main style={styles.main}>
        {title && <h1 style={styles.pageTitle}>{title}</h1>}
        {children}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  adminWrapper: {
    minHeight: '100vh',
    background: '#0f172a',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    color: '#e2e8f0',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    height: '64px',
    background: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
    flexShrink: 0,
  },
  brandIcon: { fontSize: '24px' },
  brandText: {
    fontWeight: 700,
    fontSize: '18px',
    color: '#0369a1',
    letterSpacing: '-0.3px',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  navLink: {
    padding: '8px 16px',
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
    transition: 'all 0.15s',
    borderBottom: '2px solid transparent',
  },
  navLinkActive: {
    color: '#0369a1',
    background: '#eff6ff',
    borderBottom: '2px solid #0369a1',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userName: {
    fontSize: '14px',
    color: '#475569',
    fontWeight: 500,
  },
  logoutBtn: {
    padding: '6px 14px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    color: '#475569',
    fontWeight: 500,
  },
  main: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '32px 24px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '24px',
    letterSpacing: '-0.5px',
  },
};
