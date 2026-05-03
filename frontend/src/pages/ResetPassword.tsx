import { CSSProperties, FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi, getApiError } from '../services/api';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = useMemo(() => params.get('token') || '', [params]);
  const tokenMissing = !token;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      toast.success('Password reset successful. Please sign in.');
      navigate('/login');
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Reset Password</h1>
        <p style={styles.subtitle}>
          Set a new password for your Maji Watch account.
        </p>

        {tokenMissing ? (
          <p style={styles.errorBox}>
            Reset token is missing or invalid. Request a new reset link.
          </p>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={styles.label}>New Password</label>
            <input
              type="password"
              style={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              style={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              required
            />
            <button type="submit" style={styles.button} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Reset password'}
            </button>
          </form>
        )}

        <p style={styles.linkText}>
          <Link to="/forgot-password">Request new reset link</Link> | <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
    fontFamily: "'DM Sans', system-ui, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#fff',
    borderRadius: '16px',
    padding: '28px',
    boxShadow: '0 16px 40px rgba(15, 23, 42, 0.15)',
  },
  title: {
    margin: '0 0 8px',
    fontSize: '24px',
    fontWeight: 800,
    color: '#0369a1',
    textAlign: 'center',
  },
  subtitle: {
    margin: '0 0 20px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '14px',
  },
  errorBox: {
    background: '#fef2f2',
    color: '#b91c1c',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '13px',
    marginBottom: '12px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    padding: '10px 12px',
    marginBottom: '14px',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  button: {
    width: '100%',
    border: 'none',
    borderRadius: '10px',
    background: '#0369a1',
    color: '#fff',
    fontWeight: 700,
    padding: '11px 12px',
    cursor: 'pointer',
  },
  linkText: {
    marginTop: '14px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '13px',
  },
};

