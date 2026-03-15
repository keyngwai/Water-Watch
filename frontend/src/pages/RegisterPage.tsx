import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../context/auth.store';
import { getApiError } from '../services/api';
import { KENYAN_COUNTIES } from '../types';

export default function RegisterPage() {
  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '', county: '' });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await register(form);
      toast.success('Account created! Welcome to Maji Watch.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getApiError(err));
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>💧</div>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Join Maji Watch to report water issues in your community</p>
        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Full Name *</label>
          <input style={styles.input} type="text" placeholder="John Kamau" value={form.full_name}
            onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} required />

          <label style={styles.label}>Email Address *</label>
          <input style={styles.input} type="email" placeholder="john@example.com" value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />

          <label style={styles.label}>Phone Number</label>
          <input style={styles.input} type="tel" placeholder="+254 7XX XXX XXX" value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />

          <label style={styles.label}>County</label>
          <select style={styles.input} value={form.county}
            onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}>
            <option value="">Select your county</option>
            {KENYAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <label style={styles.label}>Password *</label>
          <input style={styles.input} type="password" placeholder="Min. 8 characters with uppercase & number"
            value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />

          <button type="submit" style={styles.btn} disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p style={styles.link}>
          Already have an account? <Link to="/login" style={{ color: '#0369a1' }}>Sign in</Link>
        </p>
        <Link to="/" style={{ ...styles.link, display: 'block', textAlign: 'center', color: '#94a3b8', marginTop: '8px' }}>
          ← Back to home
        </Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
    maxWidth: '440px',
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
