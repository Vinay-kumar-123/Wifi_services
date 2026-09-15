import React from 'react';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';

export const MobileNav = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative flex w-full max-w-xs flex-1 flex-col bg-slate-900">
        <div className="absolute top-0 right-0 -mr-12 pt-4">
          <button
            type="button"
            className="ml-1 flex h-10 w-10 items-center justify-center rounded-full text-white hover:bg-white/10 focus:outline-none"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <Sidebar onCloseMobile={onClose} />
      </div>
    </div>
  );
};

export default MobileNav;
