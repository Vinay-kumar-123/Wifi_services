import React from 'react';
import { format } from 'date-fns';
import { History, ArrowRight } from 'lucide-react';
import { ROLE_COLORS, ROLE_LABELS } from '@/constants/roles';
import { STATUS_LABELS } from '@/constants/complaintStatus';

export const ComplaintHistoryList = ({ history = [], loading = false }) => {
  const formatTimestamp = (ts) => {
    if (!ts) return 'Just now';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return format(date, 'MMM d, yyyy · h:mm:ss a');
    } catch {
      return 'Date unavailable';
    }
  };

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-14 bg-slate-100 rounded-xl"></div>
        <div className="h-14 bg-slate-100 rounded-xl"></div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-xl border border-slate-200/60">
        <History className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="text-xs font-medium">No history log entries recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="divide-y divide-slate-100">
        {history.map((record) => (
          <li key={record.id} className="py-3.5 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 break-words">
                    {record.changedByName || 'System Actor'}
                  </span>
                  {record.changedByRole && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        ROLE_COLORS[record.changedByRole] || 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {ROLE_LABELS[record.changedByRole] || record.changedByRole}
                    </span>
                  )}
                </div>

                {/* Status Transition Badges */}
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
                  {record.fromStatus ? (
                    <>
                      <span className="font-medium text-slate-500 break-words">
                        {STATUS_LABELS[record.fromStatus] || record.fromStatus}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-bold text-slate-800 break-words">
                        {STATUS_LABELS[record.toStatus] || record.toStatus}
                      </span>
                    </>
                  ) : (
                    <span className="font-bold text-slate-800 break-words">
                      Initial Status: {STATUS_LABELS[record.toStatus] || record.toStatus}
                    </span>
                  )}
                </div>

                {record.note && (
                  <p className="mt-1 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100/80 break-words leading-relaxed">
                    {record.note}
                  </p>
                )}
              </div>

              <time className="text-[11px] text-slate-400 sm:text-right shrink-0">
                {formatTimestamp(record.createdAt)}
              </time>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ComplaintHistoryList;
