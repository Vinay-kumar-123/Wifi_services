import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';

// Guards & Layouts
import PublicRoute from '@/routes/PublicRoute';
import ProtectedRoute from '@/routes/ProtectedRoute';
import RoleRoute from '@/routes/RoleRoute';
import DashboardLayout from '@/layouts/DashboardLayout';
import LoadingSpinner from '@/components/common/LoadingSpinner';

// Lazy-loaded Auth Pages
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const UnauthorizedPage = lazy(() => import('@/pages/auth/UnauthorizedPage'));
const DeactivatedPage = lazy(() => import('@/pages/auth/DeactivatedPage'));
const NotFoundPage = lazy(() => import('@/pages/auth/NotFoundPage'));

// Lazy-loaded Customer Pages
const CustomerDashboardPage = lazy(() => import('@/pages/customer/CustomerDashboardPage'));
const NewComplaintPage = lazy(() => import('@/pages/customer/NewComplaintPage'));
const CustomerComplaintsPage = lazy(() => import('@/pages/customer/CustomerComplaintsPage'));
const ComplaintDetailPage = lazy(() => import('@/pages/customer/ComplaintDetailPage'));

// Lazy-loaded Admin Pages
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminComplaintsPage = lazy(() => import('@/pages/admin/AdminComplaintsPage'));
const AdminComplaintDetailPage = lazy(() => import('@/pages/admin/AdminComplaintDetailPage'));
const AdminUsersPage = lazy(() => import('@/pages/admin/AdminUsersPage'));
const AdminAuditLogsPage = lazy(() => import('@/pages/admin/AdminAuditLogsPage'));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'));

// Lazy-loaded Technician Pages
const TechnicianDashboardPage = lazy(() => import('@/pages/technician/TechnicianDashboardPage'));
const TechnicianComplaintDetailPage = lazy(() => import('@/pages/technician/TechnicianComplaintDetailPage'));

const RootRedirect = () => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen label="Initializing WiFi Service Desk..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (userProfile?.role === ROLES.ADMIN) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  if (userProfile?.role === ROLES.TECHNICIAN) {
    return <Navigate to="/technician/dashboard" replace />;
  }
  return <Navigate to="/customer/dashboard" replace />;
};

export const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner fullScreen label="Loading workspace..." />}>
      <Routes>
        {/* Root smart redirect */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public Auth Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <RegisterPage />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPasswordPage />
            </PublicRoute>
          }
        />

        {/* Access control feedback pages */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/deactivated" element={<DeactivatedPage />} />

        {/* Protected App Routes with Dashboard Layout */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Customer Portal */}
          <Route
            path="/customer/dashboard"
            element={
              <RoleRoute allowedRoles={[ROLES.CUSTOMER]}>
                <CustomerDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/customer/new-complaint"
            element={
              <RoleRoute allowedRoles={[ROLES.CUSTOMER]}>
                <NewComplaintPage />
              </RoleRoute>
            }
          />
          <Route
            path="/customer/complaints"
            element={
              <RoleRoute allowedRoles={[ROLES.CUSTOMER]}>
                <CustomerComplaintsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/customer/complaints/:id"
            element={
              <RoleRoute allowedRoles={[ROLES.CUSTOMER]}>
                <ComplaintDetailPage />
              </RoleRoute>
            }
          />

          {/* Admin Operations Portal */}
          <Route
            path="/admin/dashboard"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/complaints"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminComplaintsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/complaints/:id"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminComplaintDetailPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminUsersPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminAuditLogsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminAnalyticsPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <RoleRoute allowedRoles={[ROLES.ADMIN]}>
                <AdminDashboardPage />
              </RoleRoute>
            }
          />

          {/* Technician Portal */}
          <Route
            path="/technician/dashboard"
            element={
              <RoleRoute allowedRoles={[ROLES.TECHNICIAN]}>
                <TechnicianDashboardPage />
              </RoleRoute>
            }
          />
          <Route
            path="/technician/complaints/:id"
            element={
              <RoleRoute allowedRoles={[ROLES.TECHNICIAN]}>
                <TechnicianComplaintDetailPage />
              </RoleRoute>
            }
          />
          <Route
            path="/technician/in-progress"
            element={<Navigate to="/technician/dashboard?tab=active" replace />}
          />
          <Route
            path="/technician/resolved"
            element={<Navigate to="/technician/dashboard?tab=resolved" replace />}
          />
          <Route
            path="/technician/*"
            element={
              <RoleRoute allowedRoles={[ROLES.TECHNICIAN]}>
                <TechnicianDashboardPage />
              </RoleRoute>
            }
          />
        </Route>

        {/* 404 fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
