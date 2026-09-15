import React, { useState } from 'react';
import { Menu, Wifi, LogOut, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS, ROLE_COLORS } from '@/constants/roles';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

export const Header = ({ onOpenMobileMenu }) => {
  const { userProfile, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur transition-all">
      {/* Mobile menu button and Brand */}
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="Open sidebar"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex items-center space-x-2.5 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white shadow-sm">
            <Wifi className="w-4 h-4" />
          </div>
          <span className="text-base font-bold text-slate-900 tracking-tight">WiFi Desk</span>
        </div>
      </div>

      {/* Right Actions: Notifications & User Profile */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Role badge */}
        {userProfile?.role && (
          <span
            className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
              ROLE_COLORS[userProfile.role] || 'bg-slate-100 text-slate-800'
            }`}
          >
            {ROLE_LABELS[userProfile.role] || userProfile.role}
          </span>
        )}

        {/* In-App Notification Center */}
        <NotificationDropdown />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-700 font-semibold text-xs">
              {userProfile?.displayName ? (
                userProfile.displayName.charAt(0).toUpperCase()
              ) : (
                <User className="w-4 h-4 text-slate-600" />
              )}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-sm font-semibold text-slate-800 leading-tight">
                {userProfile?.displayName || 'User'}
              </span>
              <span className="text-xs text-slate-500 truncate max-w-[140px]">
                {userProfile?.email}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl ring-1 ring-black/5 divide-y divide-slate-100 z-50 py-1">
                <div className="px-4 py-3 sm:hidden">
                  <p className="text-sm font-semibold text-slate-900">{userProfile?.displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{userProfile?.email}</p>
                  <span
                    className={`mt-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                      ROLE_COLORS[userProfile?.role] || 'bg-slate-100 text-slate-800'
                    }`}
                  >
                    {ROLE_LABELS[userProfile?.role] || userProfile?.role}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={async () => {
                      setDropdownOpen(false);
                      await logout();
                    }}
                    className="flex w-full items-center px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-2.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
