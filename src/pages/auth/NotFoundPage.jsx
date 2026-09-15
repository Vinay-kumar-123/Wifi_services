import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Home } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-6">
          <Search className="w-9 h-9" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">404</h1>
        <h2 className="text-lg font-medium text-slate-300 mb-2">Page Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">
          The page or operational view you are attempting to reach does not exist or has been relocated.
        </p>
        <Link
          to="/"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
