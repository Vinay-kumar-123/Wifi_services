import React from 'react';
import { UserX, UserCheck, X, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';

export const ToggleStatusModal = ({
  isOpen,
  onClose,
  targetUser,
  currentAdminUid,
  onConfirm,
  isLoading = false,
}) => {
  if (!isOpen || !targetUser) return null;

  const isSelf = targetUser.uid === currentAdminUid;
  const isCurrentlyActive = targetUser.isActive ?? true;
  const nextStatus = !isCurrentlyActive;

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
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                nextStatus
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'bg-rose-50 text-rose-600'
              }`}
            >
              {nextStatus ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {nextStatus ? 'Reactivate User Account' : 'Deactivate User Account'}
              </h3>
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
              <p className="font-bold">Self-Deactivation Blocked</p>
              <p className="mt-0.5 text-rose-700">
                You cannot deactivate your own administrator account.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {nextStatus ? (
                <>
                  Are you sure you want to <strong>reactivate</strong> this user account? The user will immediately regain access to the portal and support features.
                </>
              ) : (
                <>
                  Are you sure you want to <strong>deactivate</strong> this user account? The user will be immediately logged out and blocked from logging in or accessing any support features.
                </>
              )}
            </p>

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
                type="button"
                onClick={() => onConfirm(targetUser.uid, nextStatus)}
                disabled={isLoading}
                className={`inline-flex items-center px-5 py-2 rounded-xl text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50 ${
                  nextStatus
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Updating Status...
                  </>
                ) : nextStatus ? (
                  'Reactivate Account'
                ) : (
                  'Deactivate Account'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToggleStatusModal;
