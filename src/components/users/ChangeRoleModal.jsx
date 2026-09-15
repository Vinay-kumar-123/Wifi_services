import React, { useState } from 'react';
import { ShieldAlert, X, AlertCircle, Loader2, Check, ShieldCheck } from 'lucide-react';
import { ROLES, ROLE_LABELS } from '@/constants/roles';

export const ChangeRoleModal = ({
  isOpen,
  onClose,
  targetUser,
  currentAdminUid,
  onConfirm,
  isLoading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState(targetUser?.role || ROLES.CUSTOMER);

  if (!isOpen || !targetUser) return null;

  const isSelf = targetUser.uid === currentAdminUid;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSelf) return;
    if (selectedRole === targetUser.role) {
      onClose();
      return;
    }
    onConfirm(targetUser.uid, selectedRole);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 transform transition-all z-10 space-y-4">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Modify Access Role</h3>
              <p className="text-xs text-slate-500 truncate max-w-[240px]">
                {targetUser.displayName} ({targetUser.email})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSelf ? (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Self-Role Modification Blocked</p>
              <p className="mt-0.5 text-rose-700">
                You cannot modify your own administrator role to prevent accidental system lockout.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-600">
              Select the operational privilege level for this account. All role changes are logged to the audit system.
            </p>

            <div className="space-y-2">
              {[
                {
                  role: ROLES.CUSTOMER,
                  title: 'Customer',
                  description: 'Can report issues, view and cancel only their own complaints.',
                },
                {
                  role: ROLES.TECHNICIAN,
                  title: 'Field Technician',
                  description: 'Can access and update tickets assigned specifically to their UID.',
                },
                {
                  role: ROLES.ADMIN,
                  title: 'System Administrator',
                  description: 'Full operational control, manual dispatching, user roles, and audit access.',
                },
              ].map((item) => {
                const isSelected = selectedRole === item.role;
                const isCurrent = targetUser.role === item.role;

                return (
                  <label
                    key={item.role}
                    className={`block p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-purple-500 bg-purple-50/50 ring-1 ring-purple-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="radio"
                          name="roleSelect"
                          value={item.role}
                          checked={isSelected}
                          onChange={() => setSelectedRole(item.role)}
                          className="text-purple-600 focus:ring-purple-500 h-4 w-4"
                        />
                        <span className="text-xs font-bold text-slate-900">{item.title}</span>
                      </div>
                      {isCurrent && (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          Current Role
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 ml-6">{item.description}</p>
                  </label>
                );
              })}
            </div>

            {selectedRole === ROLES.ADMIN && targetUser.role !== ROLES.ADMIN && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Elevated Privilege Warning:</strong> Promoting this user gives them full administrator privileges including user management and manual technician dispatch.
                </span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || selectedRole === targetUser.role}
                className="inline-flex items-center px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-semibold text-xs shadow-md shadow-purple-700/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Updating Role...
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1.5" />
                    Confirm Role Change
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ChangeRoleModal;
