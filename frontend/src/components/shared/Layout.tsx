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
    { to: '/help', label: 'Help & FAQ' },
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
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
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
    { to: '/admin/help', label: 'Help & FAQ' },
  ];

  return (
    <nav style={{ ...styles.nav, ...styles.adminNav }}>
      <Link to="/admin" style={{ ...styles.brand, ...styles.adminBrand }}>
        <span style={{ ...styles.brandText, ...styles.adminBrandText }}>Maji Admin</span>
      </Link>
      <div style={{ ...styles.navLinks, ...styles.adminNavLinks }}>
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            style={{
              ...styles.navLink,
              ...styles.adminNavLink,
              color: location.pathname === l.to ? '#38bdf8' : '#94a3b8',
              ...(location.pathname === l.to ? { borderBottom: '2px solid #38bdf8' } : {}),
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div style={styles.adminActions}>
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          style={{ ...styles.logoutBtn, ...styles.adminLogoutBtn }}
        >
          Sign out
        </button>
      </div>
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
        {title && <h1 style={{ ...styles.pageTitle, color: isAdmin ? '#e2e8f0' : '#0f172a' }}>{title}</h1>}
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
    padding: '10px 20px',
    minHeight: '62px',
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
  adminNav: {
    background: '#0f172a',
    borderColor: '#1e293b',
    padding: '6px 12px',
    minHeight: '48px',
    gap: '8px',
    flexWrap: 'nowrap',
  },
  adminBrand: {
    marginRight: '6px',
  },
  adminBrandText: {
    color: '#38bdf8',
    fontSize: '13px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  adminNavLinks: {
    flex: 1,
    justifyContent: 'center',
    flexWrap: 'nowrap',
    gap: '4px',
    overflowX: 'auto',
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
  adminNavLink: {
    padding: '4px 7px',
    fontSize: '11px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
  },
  adminActions: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
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
    padding: '4px 10px',
    background: '#f1f5f9',
    border: '1px solid #e2e8f0',
    borderRadius: '7px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#475569',
    fontWeight: 600,
    whiteSpace: 'nowrap',
  },
  adminLogoutBtn: {
    background: '#1e293b',
    color: '#94a3b8',
    borderColor: '#334155',
    padding: '3px 8px',
    fontSize: '11px',
    flexShrink: 0,
  },
  main: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '28px 24px 36px',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '24px',
    letterSpacing: '-0.5px',
  },
};

