import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Wrench,
  CheckCircle2,
  Lock,
  UserCog,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeToUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/services/notifications/notificationService';
import { ROLES } from '@/constants/roles';

export const NotificationDropdown = () => {
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToUserNotifications(currentUser.uid, (data) => {
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = async (notif) => {
    // 1. Mark as read
    if (!notif.isRead) {
      await markNotificationAsRead(notif.id, currentUser.uid);
    }

    setIsOpen(false);

    // 2. Navigate to related complaint if exists
    if (notif.relatedComplaintId) {
      if (role === ROLES.ADMIN) {
        navigate(`/admin/complaints/${notif.relatedComplaintId}`);
      } else if (role === ROLES.TECHNICIAN) {
        navigate(`/technician/complaints/${notif.relatedComplaintId}`);
      } else {
        navigate(`/customer/complaints/${notif.relatedComplaintId}`);
      }
    }
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead(currentUser.uid);
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'assigned':
        return <Wrench className="w-4 h-4 text-amber-500" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'closed':
        return <Lock className="w-4 h-4 text-slate-500" />;
      case 'role_update':
        return <UserCog className="w-4 h-4 text-purple-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-sky-500" />;
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Recent';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 border border-slate-100 z-50 overflow-hidden divide-y divide-slate-100">
          {/* Header */}
          <div className="px-4 py-3 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800">
                  {unreadCount} unread
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center text-[11px] font-semibold text-sky-600 hover:text-sky-700 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <Bell className="w-6 h-6 mx-auto text-slate-300 mb-1" />
                <p className="text-xs font-medium text-slate-600">No notifications yet</p>
                <p className="text-[11px] text-slate-400">
                  Updates on ticket status and assignments will appear here.
                </p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 flex items-start space-x-3 cursor-pointer transition-colors ${
                    notif.isRead
                      ? 'bg-white hover:bg-slate-50/80 text-slate-600'
                      : 'bg-sky-50/40 hover:bg-sky-50 text-slate-900'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">{getIconForType(notif.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          notif.isRead ? 'text-slate-800' : 'text-slate-900 font-bold'
                        }`}
                      >
                        {notif.title}
                      </h4>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0"></span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{formatTimestamp(notif.createdAt)}</span>
                      {notif.relatedComplaintId && (
                        <span className="text-sky-600 font-semibold flex items-center">
                          Ticket #{notif.relatedComplaintId.slice(0, 6)}
                          <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
