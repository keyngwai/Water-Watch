import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../context/auth.store';
import { useThemeStore } from '../../context/theme.store';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const ThemeToggle = () => {
  const { theme, toggleTheme } = useThemeStore();
  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: '6px 10px',
        borderRadius: '8px',
        border: '1px solid var(--border-color)',
        background: 'var(--card-bg)',
        color: 'var(--text-color)',
        fontSize: '16px',
        cursor: 'pointer',
        marginRight: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
      }}
      title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
};

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
    <nav style={{ ...styles.nav, background: 'var(--nav-bg)', borderColor: 'var(--border-color)' }}>
      <Link to="/dashboard" style={styles.brand}>
        <span style={{ ...styles.brandText, color: 'var(--accent-color)' }}>Maji Watch</span>
      </Link>
      <div style={styles.navLinks}>
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            style={{
              ...styles.navLink,
              color: location.pathname === l.to ? 'var(--accent-color)' : 'var(--muted-text)',
              ...(location.pathname === l.to ? { borderBottom: '2px solid var(--accent-color)' } : {}),
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div style={styles.navRight}>
        <ThemeToggle />
        <span style={{ ...styles.userName, color: 'var(--text-color)' }}>{user?.full_name}</span>
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          style={{ ...styles.logoutBtn, background: 'var(--accent-color)', color: 'white' }}
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
    <nav style={{ ...styles.nav, background: 'var(--nav-bg)', borderColor: 'var(--border-color)' }}>
      <Link to="/admin" style={styles.brand}>
        <span style={{ ...styles.brandText, color: 'var(--accent-color)' }}>Maji Admin</span>
      </Link>
      <div style={styles.navLinks}>
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            style={{
              ...styles.navLink,
              color: location.pathname === l.to ? 'var(--accent-color)' : 'var(--muted-text)',
              ...(location.pathname === l.to ? { borderBottom: '2px solid var(--accent-color)' } : {}),
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div style={styles.adminActions}>
        <ThemeToggle />
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          style={{ ...styles.logoutBtn, background: 'var(--accent-color)', color: 'white' }}
        >
          Sign out
        </button>
      </div>
    </nav>
  );
};

const TechnicianNav = () => {
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const links = [
    { to: '/technician', label: 'My Tasks' },
    { to: '/technician/help', label: 'Tech Guide' },
  ];

  return (
    <nav style={{ ...styles.nav, background: '#0f172a', borderColor: '#1e293b' }}>
      <Link to="/technician" style={styles.brand}>
        <span style={{ ...styles.brandText, color: '#10b981' }}>Tech Portal</span>
      </Link>
      <div style={styles.navLinks}>
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            style={{
              ...styles.navLink,
              color: location.pathname === l.to ? '#10b981' : '#94a3b8',
              background: location.pathname === l.to ? '#064e3b' : 'transparent',
              borderBottom: location.pathname === l.to ? '2px solid #10b981' : 'none',
            }}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div style={styles.navRight}>
        <span style={{ ...styles.userName, color: '#e2e8f0' }}>{user?.full_name}</span>
        <button
          type="button"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          style={{ ...styles.logoutBtn, background: '#1e293b', color: '#94a3b8', borderColor: '#334155' }}
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
  const isTech = user?.role === 'technician';

  const getNav = () => {
    if (isAdmin) return <AdminNav />;
    if (isTech) return <TechnicianNav />;
    return <CitizenNav />;
  };

  return (
    <div style={styles.wrapper}>
      {getNav()}
      <main style={styles.main}>
        {title && <h1 style={{ ...styles.pageTitle, color: 'var(--text-color)' }}>{title}</h1>}
        {children}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    background: 'var(--bg-color)',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    transition: 'background 0.3s ease',
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
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '24px',
  },
};

