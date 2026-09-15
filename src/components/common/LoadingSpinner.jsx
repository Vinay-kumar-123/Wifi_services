import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ fullScreen = false, size = 'md', label = 'Loading...' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3 p-4">
      <Loader2 className={`${sizeClasses[size] || sizeClasses.md} animate-spin text-brand-600`} />
      {label && <p className="text-sm font-medium text-slate-600 animate-pulse">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 flex flex-col items-center">
          <div className="w-10 h-10 mb-3 bg-brand-50 rounded-full flex items-center justify-center text-brand-600">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
          <p className="text-sm font-semibold text-slate-800">{label}</p>
        </div>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
