export const COMPLAINT_STATUS = {
  OPEN: 'open',
  ASSIGNED: 'assigned',
  ACCEPTED: 'accepted',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
  REOPENED: 'reopened',
};

export const STATUS_LABELS = {
  [COMPLAINT_STATUS.OPEN]: 'Open',
  [COMPLAINT_STATUS.ASSIGNED]: 'Assigned',
  [COMPLAINT_STATUS.ACCEPTED]: 'Accepted',
  [COMPLAINT_STATUS.IN_PROGRESS]: 'In Progress',
  [COMPLAINT_STATUS.RESOLVED]: 'Resolved',
  [COMPLAINT_STATUS.CLOSED]: 'Closed',
  [COMPLAINT_STATUS.CANCELLED]: 'Cancelled',
  [COMPLAINT_STATUS.REOPENED]: 'Reopened',
};

export const STATUS_COLORS = {
  [COMPLAINT_STATUS.OPEN]: 'bg-blue-50 text-blue-700 border-blue-200',
  [COMPLAINT_STATUS.ASSIGNED]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  [COMPLAINT_STATUS.ACCEPTED]: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  [COMPLAINT_STATUS.IN_PROGRESS]: 'bg-amber-50 text-amber-700 border-amber-200',
  [COMPLAINT_STATUS.RESOLVED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [COMPLAINT_STATUS.CLOSED]: 'bg-slate-100 text-slate-700 border-slate-200',
  [COMPLAINT_STATUS.CANCELLED]: 'bg-rose-50 text-rose-700 border-rose-200',
  [COMPLAINT_STATUS.REOPENED]: 'bg-orange-50 text-orange-700 border-orange-200',
};

export const COMPLAINT_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const PRIORITY_LABELS = {
  [COMPLAINT_PRIORITIES.LOW]: 'Low',
  [COMPLAINT_PRIORITIES.MEDIUM]: 'Medium',
  [COMPLAINT_PRIORITIES.HIGH]: 'High',
  [COMPLAINT_PRIORITIES.CRITICAL]: 'Critical',
};

export const PRIORITY_COLORS = {
  [COMPLAINT_PRIORITIES.LOW]: 'bg-slate-100 text-slate-700 border-slate-200',
  [COMPLAINT_PRIORITIES.MEDIUM]: 'bg-sky-100 text-sky-800 border-sky-200',
  [COMPLAINT_PRIORITIES.HIGH]: 'bg-orange-100 text-orange-800 border-orange-200',
  [COMPLAINT_PRIORITIES.CRITICAL]: 'bg-red-100 text-red-800 border-red-200',
};

export const COMPLAINT_CATEGORIES = [
  'Internet not working',
  'Slow internet',
  'Frequent disconnection',
  'Router problem',
  'Wi-Fi signal problem',
  'Billing-related issue',
  'Installation issue',
  'Configuration issue',
  'Other',
];
