import { useEffect } from 'react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
const socket = io('http://localhost:3001', {
  withCredentials: true,
});
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './context/auth.store';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CitizenDashboard from './pages/citizen/Dashboard';
import SubmitReport from './pages/citizen/SubmitReport';
import MyReports from './pages/citizen/MyReports';
import ReportDetail from './pages/ReportDetail';
import AdminDashboard from './pages/admin/Dashboard';
import AdminReports from './pages/admin/Reports';
import AdminMapView from './pages/admin/MapView';
import AdminTechnicians from './pages/admin/Technicians';
import AdminFAQ from './pages/admin/FAQ';
import CitizenFAQ from './pages/citizen/FAQ';
import TechnicianDashboard from './pages/technician/Dashboard';
import TechnicianFAQ from './pages/technician/FAQ';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { user, initFromStorage } = useAuthStore();

  useEffect(() => {
    socket.on('new_report', (data) => {
      if (user?.role === 'admin') {
        toast.success(`New report submitted: ${data.reference_code || data.title || 'Report'}`);
      }
    });

    if (user?.id) {
      const techEvent = `technician_assigned_${user.id}`;
      socket.on(techEvent, (data) => {
        toast.success(`Task Assigned: ${data.referenceCode} - ${data.title}`, {
          duration: 6000,
          icon: '🛠️',
        });
      });
      return () => {
        socket.off('new_report');
        socket.off(techEvent);
      };
    }

    return () => {
      socket.off('new_report');
    };
  }, [user]);

  useEffect(() => {
    initFromStorage();
  }, [initFromStorage]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              fontFamily: "'DM Sans', sans-serif",
            },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/reports/:id" element={<ReportDetail />} />

          {/* Citizen */}
          <Route path="/dashboard" element={
            <ProtectedRoute role="citizen"><CitizenDashboard /></ProtectedRoute>
          } />
          <Route path="/report/new" element={
            <ProtectedRoute role="citizen"><SubmitReport /></ProtectedRoute>
          } />
          <Route path="/my-reports" element={
            <ProtectedRoute role="citizen"><MyReports /></ProtectedRoute>
          } />
          <Route path="/help" element={<CitizenFAQ />} />

          {/* Admin */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute role="admin"><AdminReports /></ProtectedRoute>
          } />
          <Route path="/admin/map" element={
            <ProtectedRoute role="admin"><AdminMapView /></ProtectedRoute>
          } />
          <Route path="/admin/technicians" element={
            <ProtectedRoute role="admin"><AdminTechnicians /></ProtectedRoute>
          } />
          <Route path="/admin/help" element={<AdminFAQ />} />

          {/* Technician */}
          <Route path="/technician" element={
            <ProtectedRoute role="technician"><TechnicianDashboard /></ProtectedRoute>
          } />
          <Route path="/technician/help" element={
            <ProtectedRoute role="technician"><TechnicianFAQ /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
