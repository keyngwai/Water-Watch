import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../../components/shared/Layout';
import { StatusBadge, CategoryBadge, SeverityBadge } from '../../components/shared/Badges';
import { reportsApi, getApiError } from '../../services/api';
import { useAuthStore } from '../../context/auth.store';
import { Report } from '../../types';

export default function TechnicianDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<'in_progress' | 'verified' | 'all'>('in_progress');

  // Load assignments for the current technician
  // Note: We need a way to filter by technician. If reportsApi.list doesn't support it directly, 
  // we might need a dedicated endpoint or ensure the backend filters by the logged-in tech ID.
  const { data, isLoading } = useQuery({
    queryKey: ['technician-assignments', filterStatus],
    queryFn: () => reportsApi.list({ 
      // We assume the backend list endpoint or a new one can handle assignments.
      // For now, we'll use the public list with a filter if possible, 
      // or implement a filter on the returned data.
      status: filterStatus === 'all' ? undefined : filterStatus as any,
    }),
  });

  // Filter local data to only show reports assigned to THIS technician
  // In a real app, the backend should do this for security/performance.
  const assignments = (data?.reports || []).filter((r: any) => r.assigned_to === user?.id) as Report[];

  const resolveMutation = useMutation({
    mutationFn: (reportId: string) => reportsApi.updateStatus(reportId, { status: 'resolved' }),
    onSuccess: () => {
      toast.success('Task marked as resolved!');
      queryClient.invalidateQueries({ queryKey: ['technician-assignments'] });
    },
    onError: (err) => toast.error(getApiError(err)),
  });

  return (
    <Layout title="Technician Portal">
      <div style={styles.header}>
        <div>
          <h2 style={styles.welcome}>Welcome, {user?.full_name}</h2>
          <p style={styles.subtext}>Manage your active field assignments</p>
        </div>
        <div style={styles.tabs}>
          <button 
            onClick={() => setFilterStatus('in_progress')}
            style={{ ...styles.tab, ...(filterStatus === 'in_progress' ? styles.activeTab : {}) }}
          >
            Active
          </button>
          <button 
            onClick={() => setFilterStatus('all')}
            style={{ ...styles.tab, ...(filterStatus === 'all' ? styles.activeTab : {}) }}
          >
            All
          </button>
        </div>
      </div>

      <div style={styles.grid}>
        {isLoading ? (
          <p style={{ color: '#94a3b8' }}>Loading assignments...</p>
        ) : assignments.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No assignments found for your account.</p>
          </div>
        ) : (
          assignments.map((report) => (
            <div key={report.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.refCode}>{report.reference_code}</span>
                <StatusBadge status={report.status} />
              </div>
              
              <h3 style={styles.cardTitle}>{report.title}</h3>
              <div style={styles.badges}>
                <CategoryBadge category={report.category} />
                <SeverityBadge severity={report.severity} />
              </div>

              <div style={styles.locationInfo}>
                <p style={styles.locationName}>📍 {report.location_name || 'Location details'}</p>
                <p style={styles.countyText}>{report.county}, {report.sub_county}</p>
              </div>

              <div style={styles.actions}>
                <button 
                  onClick={() => navigate(`/reports/${report.id}`)}
                  style={styles.viewBtn}
                >
                  View Details
                </button>
                {report.status !== 'resolved' && (
                  <button 
                    onClick={() => resolveMutation.mutate(report.id)}
                    disabled={resolveMutation.isPending}
                    style={styles.resolveBtn}
                  >
                    {resolveMutation.isPending ? 'Processing...' : 'Mark Resolved'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  welcome: { margin: 0, color: '#e2e8f0', fontSize: '24px' },
  subtext: { margin: '4px 0 0', color: '#94a3b8', fontSize: '14px' },
  tabs: { display: 'flex', gap: '8px', background: '#1e293b', padding: '4px', borderRadius: '8px' },
  tab: {
    padding: '6px 16px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
  },
  activeTab: { background: '#0369a1', color: 'white' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' },
  card: {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  refCode: { fontFamily: 'monospace', color: '#64748b', fontSize: '12px' },
  cardTitle: { margin: 0, color: '#f1f5f9', fontSize: '16px', fontWeight: 600 },
  badges: { display: 'flex', gap: '8px' },
  locationInfo: { padding: '12px', background: '#0f172a', borderRadius: '8px' },
  locationName: { margin: 0, color: '#e2e8f0', fontSize: '13px', fontWeight: 500 },
  countyText: { margin: '4px 0 0', color: '#64748b', fontSize: '11px' },
  actions: { display: 'flex', gap: '10px', marginTop: '8px' },
  viewBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #475569',
    background: 'transparent',
    color: '#e2e8f0',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  resolveBtn: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    background: '#10b981',
    color: 'white',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  emptyState: {
    gridColumn: '1 / -1',
    padding: '40px',
    textAlign: 'center',
    background: '#1e293b',
    borderRadius: '12px',
    color: '#94a3b8',
  }
};
