import { useState } from 'react';
import { useAuthStore } from '../context/auth.store';
import Layout from '../components/shared/Layout';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    county: user?.county || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would call an API
    toast.success('Profile updated successfully (Simulated)');
    setIsEditing(false);
  };

  return (
    <Layout title="My Profile">
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.avatar}>
              {user?.full_name.charAt(0).toUpperCase()}
            </div>
            <div style={styles.headerInfo}>
              <h2 style={styles.name}>{user?.full_name}</h2>
              <p style={styles.role}>{user?.role.toUpperCase()}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGrid}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{ ...styles.input, background: 'var(--panel-bg)', cursor: 'not-allowed' }}
                />
                <p style={styles.hint}>Email cannot be changed.</p>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={!isEditing}
                  style={{ ...styles.input, ...(isEditing ? styles.inputActive : {}) }}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={!isEditing}
                  style={{ ...styles.input, ...(isEditing ? styles.inputActive : {}) }}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>County</label>
                <input
                  type="text"
                  value={formData.county}
                  onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                  disabled={!isEditing}
                  style={{ ...styles.input, ...(isEditing ? styles.inputActive : {}) }}
                />
              </div>
            </div>

            <div style={styles.actions}>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  style={styles.editBtn}
                >
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        full_name: user?.full_name || '',
                        phone: user?.phone || '',
                        county: user?.county || '',
                      });
                    }}
                    style={styles.cancelBtn}
                  >
                    Cancel
                  </button>
                  <button type="submit" style={styles.saveBtn}>
                    Save Changes
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px 0',
  },
  card: {
    background: 'var(--card-bg)',
    borderRadius: '16px',
    border: '1px solid var(--border-color)',
    padding: '32px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '32px',
    paddingBottom: '24px',
    borderBottom: '1px solid var(--border-color)',
  },
  avatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: 'var(--accent-color)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 700,
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  name: {
    margin: 0,
    fontSize: '24px',
    fontWeight: 800,
    color: 'var(--text-color)',
  },
  role: {
    margin: 0,
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--muted-text)',
    letterSpacing: '1px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--text-color)',
  },
  input: {
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-color)',
    color: 'var(--text-color)',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
  },
  inputActive: {
    borderColor: 'var(--accent-color)',
    boxShadow: '0 0 0 2px rgba(3, 105, 161, 0.1)',
  },
  hint: {
    margin: '4px 0 0',
    fontSize: '11px',
    color: 'var(--muted-text)',
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
  },
  editBtn: {
    padding: '10px 24px',
    background: 'var(--accent-color)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '10px 24px',
    background: 'var(--accent-color)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontWeight: 700,
    fontSize: '14px',
    cursor: 'pointer',
  },
  cancelBtn: {
    padding: '10px 24px',
    background: 'transparent',
    color: 'var(--muted-text)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '14px',
    cursor: 'pointer',
  },
};
