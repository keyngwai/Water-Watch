import { CSSProperties, FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi, getApiError } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
      toast.success('If the email exists, a reset link has been sent.');
    } catch (error) {
      toast.error(getApiError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Forgot Password</h1>
        <p style={styles.subtitle}>
          Enter your account email and we will send a password reset link.
        </p>

        <form onSubmit={handleSubmit}>
          <label style={styles.label}>Email Address</label>
          <input
            type="email"
            style={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <button type="submit" style={styles.button} disabled={isSubmitting}>
            {isSubmitting ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        {submitted && (
          <p style={styles.notice}>
            Check your inbox for the reset link. If you do not see it, check spam.
          </p>
        )}

        <p style={styles.linkText}>
          Back to <Link to="/login">Sign in</Link>
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
  notice: {
    marginTop: '14px',
    padding: '10px',
    background: '#ecfeff',
    border: '1px solid #a5f3fc',
    borderRadius: '8px',
    color: '#155e75',
    fontSize: '13px',
  },
  linkText: {
    marginTop: '14px',
    textAlign: 'center',
    color: '#64748b',
    fontSize: '13px',
  },
};

