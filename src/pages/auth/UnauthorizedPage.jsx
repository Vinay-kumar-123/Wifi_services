import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';

export const UnauthorizedPage = () => {
  const { role, userProfile } = useAuth();

  let homePath = '/login';
  if (role === ROLES.ADMIN) homePath = '/admin/dashboard';
  else if (role === ROLES.TECHNICIAN) homePath = '/technician/dashboard';
  else if (role === ROLES.CUSTOMER) homePath = '/customer/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          You do not have the required operational permissions to view this resource.
          Your current account role is <span className="font-semibold text-sky-400">{userProfile?.role || 'Guest'}</span>.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={homePath}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Go to Your Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
