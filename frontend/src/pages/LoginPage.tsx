// =========================================================================
// Login Page
// =========================================================================
import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../context/auth.store';
import { getApiError } from '../services/api';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Use the store's user (just set) for redirection
      const role = useAuthStore.getState().user?.role;
      navigate(role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  return (
    <div style={authStyles.page}>
      <div style={authStyles.card}>
        <div style={authStyles.logo}>💧</div>
        <h1 style={authStyles.title}>Maji Watch</h1>
        <p style={authStyles.subtitle}>Sign in to your account</p>
        <form onSubmit={handleSubmit}>
          <label style={authStyles.label}>Email Address</label>
          <input
            id="login-email"
            name="email"
            style={authStyles.input}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <label style={authStyles.label}>Password</label>
          <input
            id="login-password"
            name="password"
            style={authStyles.input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <button type="submit" style={authStyles.btn} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p style={authStyles.link}>
          Don't have an account? <Link to="/register" style={{ color: '#0369a1' }}>Register</Link>
        </p>
        <Link to="/" style={{ ...authStyles.link, display: 'block', textAlign: 'center', color: '#94a3b8' }}>
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '', county: '' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  return (
    <div style={authStyles.page}>
      <div style={{ ...authStyles.card, maxWidth: '440px' }}>
        <div style={authStyles.logo}>💧</div>
        <h1 style={authStyles.title}>Create Account</h1>
        <p style={authStyles.subtitle}>Join Maji Watch to report water issues in your community</p>
        <form onSubmit={handleSubmit}>
          {[
            { key: 'full_name', label: 'Full Name', type: 'text', placeholder: 'John Kamau' },
            { key: 'email', label: 'Email Address', type: 'email', placeholder: 'john@example.com' },
            { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+254 7XX XXX XXX' },
            { key: 'password', label: 'Password', type: 'password', placeholder: 'Min. 8 characters' },
          ].map((field) => (
            <div key={field.key}>
              <label style={authStyles.label}>{field.label}</label>
              <input
                id={`register-${field.key}`}
                name={field.key}
                style={authStyles.input}
                type={field.type}
                placeholder={field.placeholder}
                value={form[field.key as keyof typeof form]}
                onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                required={field.key !== 'phone'}
              />
            </div>
          ))}
          <button type="submit" style={authStyles.btn} disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p style={authStyles.link}>
          Already have an account? <Link to="/login" style={{ color: '#0369a1' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const authStyles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  card: {
    background: 'white',
    borderRadius: '20px',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
  },
  logo: { fontSize: '48px', textAlign: 'center', marginBottom: '12px' },
  title: { fontSize: '26px', fontWeight: 800, textAlign: 'center', color: '#0369a1', margin: '0 0 6px', letterSpacing: '-0.5px' },
  subtitle: { fontSize: '14px', color: '#64748b', textAlign: 'center', marginBottom: '28px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #e2e8f0',
    fontSize: '14px',
    color: '#0f172a',
    marginBottom: '16px',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    background: '#f8fafc',
  },
  btn: {
    width: '100%',
    padding: '12px',
    background: '#0369a1',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '8px',
    marginBottom: '16px',
  },
  link: { fontSize: '13px', color: '#64748b', textAlign: 'center' },
};

export { LoginPage as default };
