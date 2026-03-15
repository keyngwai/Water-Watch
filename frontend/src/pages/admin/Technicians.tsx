import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Layout from '../../components/shared/Layout';
import { techniciansApi, getApiError } from '../../services/api';
import { Technician, KENYAN_COUNTIES } from '../../types';

function AddTechnicianModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '',
    employee_id: '', department: '', specialization: '', county: '',
  });

  const mutation = useMutation({
    mutationFn: () => techniciansApi.create(form as Record<string, unknown>),
    onSuccess: () => { toast.success('Technician registered.'); onSuccess(); onClose(); },
    onError: (err) => toast.error(getApiError(err)),
  });

  const field = (key: keyof typeof form, label: string, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: '14px' }}>
      <label style={ms.label}>{label}</label>
      <input
        style={ms.input}
        type={type}
        placeholder={placeholder}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div style={ms.overlay}>
      <div style={ms.modal}>
        <div style={ms.header}>
          <h3 style={{ color: '#e2e8f0', margin: 0 }}>Register New Technician</h3>
          <button onClick={onClose} style={ms.closeBtn}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          {field('full_name', 'Full Name *', 'text', 'James Ochieng')}
          {field('email', 'Email Address *', 'email', 'james@county.go.ke')}
          {field('phone', 'Phone Number', 'tel', '+254 7XX XXX XXX')}
          {field('employee_id', 'Employee ID *', 'text', 'WB-2024-001')}
          {field('department', 'Department', 'text', 'Borehole & Well Services')}
          {field('specialization', 'Specialization', 'text', 'Borehole Drilling & Repair')}
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={ms.label}>County *</label>
          <select style={ms.input} value={form.county} onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}>
            <option value="">Select County</option>
            {KENYAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {field('password', 'Temporary Password *', 'password', 'Min. 8 characters')}

        <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '20px' }}>
          ⚠️ Share this password with the technician. They should change it on first login.
        </p>

        <div style={ms.actions}>
          <button onClick={onClose} style={ms.cancelBtn}>Cancel</button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !form.full_name || !form.email || !form.employee_id || !form.county || !form.password}
            style={{ ...ms.saveBtn, opacity: mutation.isPending ? 0.7 : 1 }}
          >
            {mutation.isPending ? 'Registering...' : 'Register Technician'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({
  technician,
  onClose,
  onConfirm,
  isDeleting,
}: {
  technician: Technician;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <div style={ms.overlay}>
      <div style={ms.modal}>
        <div style={ms.header}>
          <h3 style={{ color: '#e2e8f0', margin: 0 }}>Delete Technician</h3>
          <button onClick={onClose} style={ms.closeBtn}>×</button>
        </div>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
          Are you sure you want to remove <strong style={{ color: '#e2e8f0' }}>{technician.full_name}</strong> ({technician.employee_id})?
          Their account will be deleted and any assigned reports will be unassigned.
        </p>
        <div style={ms.actions}>
          <button onClick={onClose} style={ms.cancelBtn}>Cancel</button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            style={{ ...ms.deleteBtn, opacity: isDeleting ? 0.7 : 1 }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Technician'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminTechnicians() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [countyFilter, setCountyFilter] = useState('');
  const [techToDelete, setTechToDelete] = useState<Technician | null>(null);

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ['technicians', countyFilter],
    queryFn: () => techniciansApi.list(countyFilter || undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => techniciansApi.delete(id),
    onSuccess: () => {
      toast.success('Technician removed.');
      setTechToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports'], exact: false });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <Layout title="Field Technicians">
      {techToDelete && (
        <DeleteConfirmModal
          technician={techToDelete}
          onClose={() => setTechToDelete(null)}
          onConfirm={() => deleteMutation.mutate(techToDelete.id)}
          isDeleting={deleteMutation.isPending}
        />
      )}
      {showAdd && (
        <AddTechnicianModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['technicians'] })}
        />
      )}

      <div style={styles.toolbar}>
        <select
          style={styles.filterSelect}
          value={countyFilter}
          onChange={(e) => setCountyFilter(e.target.value)}
        >
          <option value="">All Counties</option>
          {KENYAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <span style={{ color: '#64748b', fontSize: '13px' }}>
          {technicians.length} technician{technicians.length !== 1 ? 's' : ''}
        </span>

        <button onClick={() => setShowAdd(true)} style={styles.addBtn}>
          + Add Technician
        </button>
      </div>

      {isLoading ? (
        <div style={styles.loading}>Loading technicians...</div>
      ) : technicians.length === 0 ? (
        <div style={styles.empty}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>👷</div>
          <h3 style={{ color: '#94a3b8', margin: '0 0 8px' }}>No technicians registered</h3>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
            Register field technicians to assign them to reports.
          </p>
          <button onClick={() => setShowAdd(true)} style={styles.addBtn}>
            + Register First Technician
          </button>
        </div>
      ) : (
        <div style={styles.grid}>
          {technicians.map((tech: Technician) => (
            <div key={tech.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <div style={styles.avatar}>
                  {tech.full_name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={styles.techName}>{tech.full_name}</div>
                  <div style={styles.techId}>{tech.employee_id}</div>
                </div>
                <div style={{
                  ...styles.statusDot,
                  background: tech.is_available ? '#10b981' : '#f59e0b',
                }} title={tech.is_available ? 'Available' : 'Busy'} />
              </div>

              <div style={styles.infoRows}>
                <InfoRow label="📧 Email" value={tech.email} />
                {tech.phone && <InfoRow label="📞 Phone" value={tech.phone} />}
                <InfoRow label="🗺 County" value={tech.county} />
                {tech.department && <InfoRow label="🏢 Department" value={tech.department} />}
                {tech.specialization && <InfoRow label="🔧 Specialization" value={tech.specialization} />}
              </div>

              <div style={styles.cardFooter}>
                <div style={{
                  ...styles.availBadge,
                  background: tech.is_available ? '#ecfdf5' : '#fffbeb',
                  color: tech.is_available ? '#059669' : '#d97706',
                  borderColor: tech.is_available ? '#6ee7b7' : '#fcd34d',
                }}>
                  {tech.is_available ? '✓ Available' : '⏳ Busy'}
                </div>
                <div style={styles.assignCount}>
                  {Number(tech.active_assignments)} active job{Number(tech.active_assignments) !== 1 ? 's' : ''}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTechToDelete(tech)}
                style={styles.deleteBtn}
                title="Delete technician"
              >
                🗑 Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #1e293b' }}>
      <span style={{ fontSize: '12px', color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 500, maxWidth: '160px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' },
  filterSelect: {
    padding: '8px 12px', borderRadius: '8px', border: '1px solid #334155',
    background: '#1e293b', color: '#e2e8f0', fontSize: '13px',
  },
  addBtn: {
    padding: '9px 18px', background: '#0369a1', color: 'white', border: 'none',
    borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, marginLeft: 'auto',
  },
  loading: { padding: '40px', textAlign: 'center', color: '#64748b' },
  empty: {
    textAlign: 'center', padding: '80px 40px',
    background: '#1e293b', borderRadius: '12px', border: '1px solid #334155',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
  card: {
    background: '#1e293b', borderRadius: '12px', border: '1px solid #334155',
    padding: '20px', display: 'flex', flexDirection: 'column', gap: '0',
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  avatar: {
    width: '44px', height: '44px', borderRadius: '50%',
    background: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'white', fontWeight: 800, fontSize: '15px', flexShrink: 0,
  },
  techName: { fontSize: '15px', fontWeight: 700, color: '#e2e8f0' },
  techId: { fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' },
  statusDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  infoRows: { marginBottom: '14px' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' },
  availBadge: {
    fontSize: '12px', fontWeight: 600, padding: '4px 10px',
    borderRadius: '20px', border: '1px solid',
  },
  assignCount: { fontSize: '12px', color: '#64748b' },
  deleteBtn: {
    marginTop: '12px',
    width: '100%',
    padding: '8px 12px',
    fontSize: '12px',
    color: '#fca5a5',
    background: 'transparent',
    border: '1px solid #7f1d1d',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 500,
  },
};

// Modal styles
const ms: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, backdropFilter: 'blur(4px)',
  },
  modal: {
    background: '#1e293b', borderRadius: '16px', border: '1px solid #334155',
    padding: '28px', width: '100%', maxWidth: '580px',
    maxHeight: '90vh', overflowY: 'auto',
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: { background: 'none', border: 'none', color: '#64748b', fontSize: '24px', cursor: 'pointer', padding: 0, lineHeight: 1 },
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.4px' },
  input: {
    width: '100%', padding: '9px 12px', borderRadius: '8px',
    border: '1px solid #334155', background: '#0f172a', color: '#e2e8f0',
    fontSize: '13px', boxSizing: 'border-box', fontFamily: 'inherit',
  },
  actions: { display: 'flex', gap: '10px', justifyContent: 'flex-end' },
  cancelBtn: { padding: '9px 18px', background: '#334155', color: '#94a3b8', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' },
  saveBtn: { padding: '9px 18px', background: '#0369a1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 },
  deleteBtn: { padding: '9px 18px', background: '#7f1d1d', color: '#fecaca', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 },
};
