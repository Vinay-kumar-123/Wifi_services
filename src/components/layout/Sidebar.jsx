import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Wifi,
  LayoutDashboard,
  PlusCircle,
  FileText,
  ClipboardList,
  Clock,
  CheckCircle2,
  Users,
  BarChart3,
  ShieldCheck,
  LifeBuoy,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/constants/roles';

export const Sidebar = ({ onCloseMobile }) => {
  const { role } = useAuth();

  const getNavLinks = () => {
    if (role === ROLES.ADMIN) {
      return [
        { label: 'Operations Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Complaint Queue', path: '/admin/complaints', icon: ClipboardList },
        { label: 'Users & Roles', path: '/admin/users', icon: Users },
        { label: 'Analytics & Trends', path: '/admin/analytics', icon: BarChart3 },
        { label: 'Security Audit Logs', path: '/admin/audit-logs', icon: ShieldCheck },
      ];
    }

    if (role === ROLES.TECHNICIAN) {
      return [
        { label: 'Assigned Work', path: '/technician/dashboard', icon: ClipboardList },
        { label: 'In-Progress Tasks', path: '/technician/in-progress', icon: Clock },
        { label: 'Resolved Tickets', path: '/technician/resolved', icon: CheckCircle2 },
      ];
    }

    // Default: Customer
    return [
      { label: 'Support Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
      { label: 'Submit Complaint', path: '/customer/new-complaint', icon: PlusCircle },
      { label: 'Complaint History', path: '/customer/complaints', icon: FileText },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div className="flex h-full flex-col justify-between bg-slate-900 text-slate-300 w-64 select-none">
      <div>
        {/* Brand Header */}
        <div className="flex h-16 items-center px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center text-white shadow-md shadow-sky-500/30">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight">WiFi Service Desk</span>
              <p className="text-[10px] text-sky-400 font-semibold tracking-wider uppercase">Enterprise Operations</p>
            </div>
          </div>
        </div>

        {/* Navigation items */}
        <div className="px-3 py-6">
          <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
            Main Navigation
          </p>
          <nav className="space-y-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onCloseMobile}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Footer Support Badge */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center space-x-3 rounded-lg bg-slate-800/60 p-3 text-xs text-slate-400">
          <LifeBuoy className="w-5 h-5 text-sky-400 flex-shrink-0" />
          <div>
            <p className="font-semibold text-slate-200">24/7 Network NOC</p>
            <p className="text-[11px] text-slate-400">Service Level: 99.9%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
