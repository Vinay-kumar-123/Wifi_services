import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';
import LoadingSpinner from '@/components/common/LoadingSpinner';

/**
 * Directs already authenticated users away from public auth pages
 * into their appropriate role-based dashboard.
 */
export const PublicRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen label="Checking authentication..." />;
  }

  if (currentUser && userProfile) {
    if (userProfile.role === ROLES.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (userProfile.role === ROLES.TECHNICIAN) {
      return <Navigate to="/technician/dashboard" replace />;
    }
    return <Navigate to="/customer/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
