import React from 'react';
import { AlertTriangle, AlertOctagon, Flame, ArrowDown } from 'lucide-react';
import {
  COMPLAINT_PRIORITIES,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/constants/complaintStatus';

export const ComplaintPriorityBadge = ({ priority, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  const getPriorityIcon = () => {
    switch (priority) {
      case COMPLAINT_PRIORITIES.LOW:
        return <ArrowDown className="w-3 h-3 mr-1 text-slate-500" />;
      case COMPLAINT_PRIORITIES.MEDIUM:
        return <AlertTriangle className="w-3 h-3 mr-1 text-sky-600" />;
      case COMPLAINT_PRIORITIES.HIGH:
        return <Flame className="w-3 h-3 mr-1 text-orange-600" />;
      case COMPLAINT_PRIORITIES.CRITICAL:
        return <AlertOctagon className="w-3 h-3 mr-1 text-rose-600 animate-pulse" />;
      default:
        return null;
    }
  };

  const colorClass = PRIORITY_COLORS[priority] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = PRIORITY_LABELS[priority] || priority;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${colorClass} ${
        sizeClasses[size] || sizeClasses.md
      }`}
    >
      {getPriorityIcon()}
      {label}
    </span>
  );
};

export default ComplaintPriorityBadge;
