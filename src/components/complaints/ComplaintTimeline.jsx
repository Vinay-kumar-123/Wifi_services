import React from 'react';
import {
  Check,
  Clock,
  UserCheck,
  Play,
  CheckCircle2,
  Lock,
  XCircle,
  FileCheck,
} from 'lucide-react';
import { format } from 'date-fns';
import { COMPLAINT_STATUS } from '@/constants/complaintStatus';

export const ComplaintTimeline = ({ complaint }) => {
  if (!complaint) return null;

  const isCancelled = complaint.status === COMPLAINT_STATUS.CANCELLED;

  const steps = [
    {
      key: COMPLAINT_STATUS.OPEN,
      title: 'Ticket Submitted',
      description: 'Complaint received and logged in queue',
      icon: FileCheck,
      timestamp: complaint.createdAt,
    },
    {
      key: COMPLAINT_STATUS.ASSIGNED,
      title: 'Technician Assigned',
      description: complaint.assignedTechnicianName
        ? `Assigned to ${complaint.assignedTechnicianName}`
        : 'Technician Assigned',
      icon: UserCheck,
      timestamp: complaint.assignedAt || null,
    },
    {
      key: COMPLAINT_STATUS.ACCEPTED,
      title: 'Assignment Accepted',
      description: 'Technician acknowledged dispatch',
      icon: Clock,
      timestamp: complaint.acceptedAt || null,
    },
    {
      key: COMPLAINT_STATUS.IN_PROGRESS,
      title: 'Work In Progress',
      description: 'Technician investigating network incident',
      icon: Play,
      timestamp: complaint.inProgressAt || null,
    },
    {
      key: COMPLAINT_STATUS.RESOLVED,
      title: 'Issue Resolved',
      description: complaint.resolutionNotes ? 'Resolution notes recorded' : 'Awaiting completion',
      icon: CheckCircle2,
      timestamp: complaint.resolvedAt || null,
    },
    {
      key: COMPLAINT_STATUS.CLOSED,
      title: 'Ticket Closed',
      description: 'Verified and formally archived',
      icon: Lock,
      timestamp: complaint.closedAt || null,
    },
  ];

  const statusOrder = [
    COMPLAINT_STATUS.OPEN,
    COMPLAINT_STATUS.ASSIGNED,
    COMPLAINT_STATUS.ACCEPTED,
    COMPLAINT_STATUS.IN_PROGRESS,
    COMPLAINT_STATUS.RESOLVED,
    COMPLAINT_STATUS.CLOSED,
  ];

  const currentIdx = statusOrder.indexOf(complaint.status);

  const formatTimestamp = (ts) => {
    if (!ts) return null;
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return format(date, 'MMM d, yyyy · h:mm a');
    } catch {
      return null;
    }
  };

  if (isCancelled) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-5">
        <div className="flex items-center space-x-3 text-rose-700">
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h4 className="text-base font-bold text-rose-900">Complaint Cancelled</h4>
            <p className="text-xs text-rose-700 mt-0.5">
              This ticket was cancelled while in open status. No technical work is dispatched for this ticket.
            </p>
            {complaint.updatedAt && (
              <p className="text-xs text-rose-600/80 mt-1 font-medium">
                {formatTimestamp(complaint.updatedAt)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-5">
        Progress Lifecycle
      </h3>

      <div className="space-y-5">
        {steps.map((step, idx) => {
          const isDone = currentIdx >= idx;
          const isCurrent = currentIdx === idx;
          const formattedTime = formatTimestamp(step.timestamp);
          const Icon = step.icon;

          return (
            <div key={step.key} className="relative pl-8 last:pb-0">
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-[11px] top-7 h-[calc(100%+0.75rem)] w-px ${
                    isDone ? 'bg-sky-200' : 'bg-slate-200'
                  }`}
                />
              )}

              <div
                className={`absolute left-0 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border ring-4 ring-white ${
                  isDone
                    ? 'border-sky-600 bg-sky-600 text-white shadow-sm'
                    : 'border-slate-300 bg-slate-100 text-slate-400'
                } ${isCurrent ? 'border-sky-200 bg-sky-100 text-sky-700 ring-sky-100' : ''}`}
              >
                {isDone && !isCurrent ? (
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                ) : (
                  <Icon className="h-3.5 w-3.5" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h4
                    className={`text-sm font-semibold leading-snug break-words ${
                      isCurrent
                        ? 'text-sky-700 font-bold'
                        : isDone
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </h4>

                  {formattedTime && (
                    <time className="text-[11px] font-medium text-slate-500 sm:text-right">
                      {formattedTime}
                    </time>
                  )}
                </div>

                <p
                  className={`mt-1 text-xs leading-relaxed break-words ${
                    isDone ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComplaintTimeline;
