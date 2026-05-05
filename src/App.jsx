import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

import AdminLayout from './components/layout/AdminLayout';
import MemberLayout from './components/layout/MemberLayout';
import PublicLayout from './components/layout/PublicLayout';

import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import AccessDenied from './pages/public/AccessDenied';

import MemberDashboard from './pages/member/MemberDashboard';
import CompleteProfilePage from './pages/member/CompleteProfilePage';
import EditProfilePage from './pages/member/EditProfilePage';
import MyMembershipPage from './pages/member/MyMembershipPage';
import MembershipCardPage from './pages/member/MembershipCardPage';
import MemberAnnouncementsPage from './pages/member/MemberAnnouncementsPage';

import AdminDashboard from './pages/admin/AdminDashboard';
import MembersPage from './pages/admin/MembersPage';
import MemberDetails from './pages/admin/MemberDetails';
import ApprovalsPage from './pages/admin/ApprovalsPage';
import PaymentsPage from './pages/admin/PaymentsPage';
import PlansPage from './pages/admin/PlansPage';
import ReportsPage from './pages/admin/ReportsPage';
import AnnouncementsPage from './pages/admin/AnnouncementsPage';
import SettingsPage from './pages/admin/SettingsPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';
import AdminReviewTasksPage from './pages/admin/AdminReviewTasksPage';

function App() {
  return (
    <AuthProvider>
      <OrganizationProvider>
        <Router>
          <Toaster position="top-right" toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              padding: '16px',
              fontSize: '14px',
              fontWeight: '600',
            }
          }} />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/access-denied" element={<AccessDenied />} />
            </Route>

            <Route element={
              <ProtectedRoute allowedRoles={['member', 'staff', 'manager', 'admin']}>
                <MemberLayout><Outlet /></MemberLayout>
              </ProtectedRoute>
            }>
              <Route path="/member/dashboard" element={<MemberDashboard />} />
              <Route path="/member/complete-profile" element={<CompleteProfilePage />} />
              <Route path="/member/profile" element={<EditProfilePage />} />
              <Route path="/member/membership" element={<MyMembershipPage />} />
              <Route path="/member/membership-card" element={<MembershipCardPage />} />
              <Route path="/member/announcements" element={<MemberAnnouncementsPage />} />
            </Route>

            <Route element={
              <ProtectedRoute allowedRoles={['staff', 'manager', 'admin']}>
                <AdminLayout><Outlet /></AdminLayout>
              </ProtectedRoute>
            }>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/members" element={<MembersPage />} />
              <Route path="/admin/members/:id" element={<MemberDetails />} />
              <Route path="/admin/approvals" element={<ApprovalsPage />} />
              <Route path="/admin/payments" element={<PaymentsPage />} />
              <Route path="/admin/plans" element={<PlansPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/announcements" element={<AnnouncementsPage />} />
              <Route path="/admin/settings" element={<SettingsPage />} />
              <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
              <Route path="/admin/review-tasks" element={<AdminReviewTasksPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </OrganizationProvider>
    </AuthProvider>
  );
}

export default App;
