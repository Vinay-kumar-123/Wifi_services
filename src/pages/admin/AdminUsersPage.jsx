import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Users,
  Search,
  Filter,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Calendar,
  Loader2,
  AlertCircle,
  Wrench,
  UserCog,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getFirestoreErrorMessage } from '@/utils/firebaseErrors';
import {
  getUsersPaginated,
  changeUserRoleAdmin,
  toggleUserStatusAdmin,
} from '@/services/users/userService';
import { createTechnicianAccount } from '@/services/auth/authService';
import { ROLES, ROLE_LABELS, ROLE_COLORS } from '@/constants/roles';
import ChangeRoleModal from '@/components/users/ChangeRoleModal';
import ToggleStatusModal from '@/components/users/ToggleStatusModal';
import AddTechnicianModal from '@/components/users/AddTechnicianModal';

const USER_TABS = [
  { key: 'technician', label: 'Technicians', role: ROLES.TECHNICIAN },
  { key: 'admin', label: 'Administrators', role: ROLES.ADMIN },
  { key: 'customer', label: 'Customers', role: ROLES.CUSTOMER },
  { key: 'deactivated', label: 'Deactivated Users' },
  { key: 'all', label: 'All Users' },
];

export const AdminUsersPage = () => {
  const { currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState(ROLES.TECHNICIAN);
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('technician');

  // Pagination
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Modal States
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [technicianModalOpen, setTechnicianModalOpen] = useState(false);
  const [creatingTechnician, setCreatingTechnician] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const applyTab = useCallback((tabKey) => {
    setActiveTab(tabKey);

    if (tabKey === 'deactivated') {
      setRoleFilter('all');
      setStatusFilter('false');
      return;
    }

    if (tabKey === 'all') {
      setRoleFilter('all');
      setStatusFilter('all');
      return;
    }

    setRoleFilter(tabKey);
    setStatusFilter('all');
  }, []);

  const fetchUsers = useCallback(
    async (isInitial = true) => {
      try {
        if (isInitial) {
          setLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const res = await getUsersPaginated({
          role: roleFilter,
          isActive: statusFilter,
          pageSize: 15,
          lastVisibleDoc: isInitial ? null : lastDoc,
        });

        if (isInitial) {
          setUsers(res.users);
        } else {
          setUsers((prev) => [...prev, ...res.users]);
        }

        setLastDoc(res.lastDoc);
        setHasMore(res.hasMore);
      } catch (err) {
        console.error('[AdminUsersPage] Error fetching users:', err);
        setError(getFirestoreErrorMessage(err, 'load user accounts'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [roleFilter, statusFilter, lastDoc]
  );

  useEffect(() => {
    fetchUsers(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setActiveTab('technician');
    setRoleFilter(ROLES.TECHNICIAN);
    setStatusFilter('all');
  };

  const handleCreateTechnician = async (payload) => {
    try {
      setCreatingTechnician(true);
      const result = await createTechnicianAccount({
        ...payload,
      });

      toast.success(
        result.setupEmailSent
          ? 'Technician created. Account setup email sent.'
          : 'Technician created, but the setup email could not be sent.'
      );
      setTechnicianModalOpen(false);
      applyTab('technician');
    } catch (err) {
      console.error('[AdminUsersPage] Technician creation failed:', err);
      throw new Error(err?.message || 'Unable to create technician account.');
    } finally {
      setCreatingTechnician(false);
    }
  };

  // Action Handlers
  const handleConfirmRoleChange = async (targetUserId, newRole) => {
    try {
      setActionLoading(true);
      await changeUserRoleAdmin(targetUserId, newRole, currentUser);
      toast.success('User role successfully updated!');
      setRoleModalOpen(false);
      setSelectedUser(null);
      fetchUsers(true);
    } catch (err) {
      console.error('Role change error:', err);
      toast.error(err.message || 'Failed to update user role.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmStatusToggle = async (targetUserId, newActiveState) => {
    try {
      setActionLoading(true);
      await toggleUserStatusAdmin(targetUserId, newActiveState, currentUser);
      toast.success(
        newActiveState
          ? 'Account successfully reactivated.'
          : 'Account successfully deactivated and revoked.'
      );
      setStatusModalOpen(false);
      setSelectedUser(null);
      fetchUsers(true);
    } catch (err) {
      console.error('Status toggle error:', err);
      toast.error(err.message || 'Failed to update account status.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Unknown';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return format(date, 'MMM d, yyyy');
    } catch {
      return 'Recent';
    }
  };

  // Client-side text search
  const filteredUsers = users.filter((u) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = u.displayName?.toLowerCase().includes(term);
    const emailMatch = u.email?.toLowerCase().includes(term);
    const phoneMatch = u.phone?.toLowerCase().includes(term);
    return nameMatch || emailMatch || phoneMatch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Users & Access Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage subscriber and technician profiles, assign operational roles, and regulate account access.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTechnicianModalOpen(true)}
            className="inline-flex items-center rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white shadow-md shadow-amber-600/20 transition-colors hover:bg-amber-500"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Technician
          </button>

          <button
            type="button"
            onClick={() => fetchUsers(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
            Refresh Users
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {USER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => applyTab(tab.key)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>

          {/* Role Filter */}
          <div>
            <select
              value={roleFilter}
              onChange={(e) => {
                const nextRole = e.target.value;
                setRoleFilter(nextRole);
                setActiveTab(nextRole === 'all' ? 'all' : nextRole);
                setStatusFilter('all');
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="all">All Roles</option>
              <option value={ROLES.CUSTOMER}>Customers</option>
              <option value={ROLES.TECHNICIAN}>Technicians</option>
              <option value={ROLES.ADMIN}>Administrators</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                const nextStatus = e.target.value;
                setStatusFilter(nextStatus);
                if (nextStatus === 'false') {
                  setActiveTab('deactivated');
                  setRoleFilter('all');
                } else if (nextStatus === 'all') {
                  setActiveTab(roleFilter === 'all' ? 'all' : roleFilter);
                } else {
                  setActiveTab(roleFilter === 'all' ? 'all' : roleFilter);
                }
              }}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="true">Active Accounts Only</option>
              <option value="false">Deactivated Accounts Only</option>
            </select>
          </div>
        </div>

        {(searchTerm !== '' || roleFilter !== 'all' || statusFilter !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Filtered user view</span>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center text-purple-700 hover:text-purple-800 font-semibold"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 bg-white rounded-2xl border border-slate-200 animate-pulse"
            ></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700 space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={() => fetchUsers(true)}
            className="text-xs font-semibold underline hover:no-underline"
          >
            Retry Query
          </button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No users found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            No accounts match your current query or role/status filters.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Access Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUsers.map((u) => {
                  const isSelf = u.uid === currentUser?.uid;
                  const isActive = u.isActive ?? true;

                  return (
                    <tr key={u.uid} className="hover:bg-slate-50/70 transition-colors">
                      {/* Name & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {u.displayName ? u.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="truncate max-w-[200px]">
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-slate-900 truncate">
                                {u.displayName || 'User'}
                              </span>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isActive ? (
                          <span className="inline-flex items-center text-xs font-medium text-emerald-700">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium text-rose-600">
                            <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5"></span>
                            Deactivated
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {u.phone ? (
                          <span className="flex items-center">
                            <Phone className="w-3 h-3 mr-1 text-slate-400" />
                            {u.phone}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Creation Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                        {formatTimestamp(u.createdAt)}
                      </td>

                      {/* Action Controls */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isSelf ? (
                          <span className="text-[11px] text-slate-400 italic">
                            Account protected
                          </span>
                        ) : (
                          <div className="inline-flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setRoleModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
                            >
                              Role
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUser(u);
                                setStatusModalOpen(true);
                              }}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                                isActive
                                  ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                              }`}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredUsers.map((u) => {
              const isSelf = u.uid === currentUser?.uid;
              const isActive = u.isActive ?? true;

              return (
                <div key={u.uid} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{u.displayName}</span>
                      {isSelf && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                          You
                        </span>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${
                        ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <p className="flex items-center">
                      <Mail className="w-3 h-3 mr-1 text-slate-400" />
                      {u.email}
                    </p>
                    {u.phone && (
                      <p className="flex items-center">
                        <Phone className="w-3 h-3 mr-1 text-slate-400" />
                        {u.phone}
                      </p>
                    )}
                    <p className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                      Registered: {formatTimestamp(u.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      {isActive ? (
                        <span className="inline-flex items-center text-xs font-medium text-emerald-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-medium text-rose-600">
                          <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5"></span>
                          Deactivated
                        </span>
                      )}
                    </div>

                    {!isSelf && (
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setRoleModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 rounded border border-purple-200"
                        >
                          Change Role
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUser(u);
                            setStatusModalOpen(true);
                          }}
                          className={`px-2.5 py-1 text-xs font-semibold rounded border ${
                            isActive
                              ? 'text-rose-700 bg-rose-50 border-rose-200'
                              : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          }`}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {hasMore && (
            <div className="text-center p-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => fetchUsers(false)}
                disabled={loadingMore}
                className="inline-flex items-center px-5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-purple-600" />
                    Loading More Users...
                  </>
                ) : (
                  'Load More Users'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Role Modification Modal */}
      {selectedUser && (
        <ChangeRoleModal
          isOpen={roleModalOpen}
          onClose={() => {
            setRoleModalOpen(false);
            setSelectedUser(null);
          }}
          targetUser={selectedUser}
          currentAdminUid={currentUser?.uid}
          onConfirm={handleConfirmRoleChange}
          isLoading={actionLoading}
        />
      )}

      {/* Account Activation/Deactivation Modal */}
      {selectedUser && (
        <ToggleStatusModal
          isOpen={statusModalOpen}
          onClose={() => {
            setStatusModalOpen(false);
            setSelectedUser(null);
          }}
          targetUser={selectedUser}
          currentAdminUid={currentUser?.uid}
          onConfirm={handleConfirmStatusToggle}
          isLoading={actionLoading}
        />
      )}

      <AddTechnicianModal
        isOpen={technicianModalOpen}
        onClose={() => setTechnicianModalOpen(false)}
        onSubmit={handleCreateTechnician}
        isLoading={creatingTechnician}
      />
    </div>
  );
};

export default AdminUsersPage;
