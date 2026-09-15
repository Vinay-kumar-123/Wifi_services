import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import LoadingSpinner from '@/components/common/LoadingSpinner';

/**
 * Ensures the authenticated user has one of the required roles.
 * Never trusts client input; checks the verified userProfile role.
 */
export const RoleRoute = ({ allowedRoles = [], children }) => {
  const { role, loading, userProfile } = useAuth();

  if (loading) {
    return <LoadingSpinner fullScreen label="Checking authorization..." />;
  }

  if (!userProfile || !role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default RoleRoute;
