import React from 'react';
import { Link } from 'react-router-dom';
import { UserX, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const DeactivatedPage = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
      <div className="max-w-md w-full bg-slate-900 border border-rose-900/40 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-6">
          <UserX className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Account Deactivated</h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          Your account has been deactivated by a system administrator.
          You cannot access support services or internal portals while this status is active.
        </p>
        <div className="pt-2 flex justify-center">
          <button
            onClick={() => logout()}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-sm transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeactivatedPage;
