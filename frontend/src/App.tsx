import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';

// Pages
import { LoginPage } from './pages/LoginPage';

// Student
import { StudentDashboard } from './pages/student/Dashboard';
import { SubmitRequest } from './pages/student/SubmitRequest';
import { StudentRequestsList } from './pages/student/RequestsList';
import { StudentRequestDetail } from './pages/student/RequestDetail';
import { StudentNotifications } from './pages/student/Notifications';

// Officer
import { OfficerDashboard } from './pages/officer/Dashboard';
import { OfficerRequestsList } from './pages/officer/RequestsList';
import { OfficerRequestDetail } from './pages/officer/RequestDetail';

// Admin
import { AdminDashboard } from './pages/admin/Dashboard';
import { AdminRequestsList } from './pages/admin/RequestsList';
import { AdminAnalytics } from './pages/admin/Analytics';
import { AdminBottlenecks } from './pages/admin/Bottlenecks';
import { AdminAuditHistory } from './pages/admin/AuditHistory';
import { AdminSLA } from './pages/admin/SLAMonitoring';

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) {
    if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
    if (user.role === 'officer') return <Navigate to="/officer/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children}</>;
}

function RoleRedirect() {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (user?.role === 'officer') return <Navigate to="/officer/dashboard" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RoleRedirect />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Student routes */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute roles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/student/submit" element={
        <ProtectedRoute roles={['student']}>
          <SubmitRequest />
        </ProtectedRoute>
      } />
      <Route path="/student/requests" element={
        <ProtectedRoute roles={['student']}>
          <StudentRequestsList />
        </ProtectedRoute>
      } />
      <Route path="/student/requests/:id" element={
        <ProtectedRoute roles={['student']}>
          <StudentRequestDetail />
        </ProtectedRoute>
      } />
      <Route path="/student/notifications" element={
        <ProtectedRoute roles={['student']}>
          <StudentNotifications />
        </ProtectedRoute>
      } />

      {/* Officer routes */}
      <Route path="/officer/dashboard" element={
        <ProtectedRoute roles={['officer', 'admin']}>
          <OfficerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/officer/requests" element={
        <ProtectedRoute roles={['officer', 'admin']}>
          <OfficerRequestsList />
        </ProtectedRoute>
      } />
      <Route path="/officer/requests/:id" element={
        <ProtectedRoute roles={['officer', 'admin']}>
          <OfficerRequestDetail />
        </ProtectedRoute>
      } />
      {/* Alias for SLA alerts */}
      <Route path="/officer/sla-alerts" element={
        <ProtectedRoute roles={['officer', 'admin']}>
          <OfficerRequestsList />
        </ProtectedRoute>
      } />
      <Route path="/officer/notifications" element={
        <ProtectedRoute roles={['officer', 'admin']}>
          <StudentNotifications />
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute roles={['admin']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/admin/requests" element={
        <ProtectedRoute roles={['admin']}>
          <AdminRequestsList />
        </ProtectedRoute>
      } />
      <Route path="/admin/analytics" element={
        <ProtectedRoute roles={['admin']}>
          <AdminAnalytics />
        </ProtectedRoute>
      } />
      <Route path="/admin/bottlenecks" element={
        <ProtectedRoute roles={['admin']}>
          <AdminBottlenecks />
        </ProtectedRoute>
      } />
      <Route path="/admin/audit" element={
        <ProtectedRoute roles={['admin']}>
          <AdminAuditHistory />
        </ProtectedRoute>
      } />
      <Route path="/admin/sla" element={
        <ProtectedRoute roles={['admin']}>
          <AdminSLA />
        </ProtectedRoute>
      } />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
