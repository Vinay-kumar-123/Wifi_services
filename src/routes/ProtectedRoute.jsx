import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

/**
 * Protects routes requiring an active authenticated user.
 * Redirects unauthenticated users to /login preserving the return URL.
 */
export const ProtectedRoute = ({ children }) => {
  const { currentUser, userProfile, loading, isActive } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner fullScreen label="Verifying session..." />;
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userProfile && !isActive) {
    return <Navigate to="/deactivated" replace />;
  }

  return children;
};

export default ProtectedRoute;
