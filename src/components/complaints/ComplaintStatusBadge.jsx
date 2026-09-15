import React from 'react';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  UserCheck,
  Play,
  Check,
} from 'lucide-react';
import { COMPLAINT_STATUS, STATUS_LABELS, STATUS_COLORS } from '@/constants/complaintStatus';

export const ComplaintStatusBadge = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs sm:text-sm',
    lg: 'px-3 py-1.5 text-sm font-semibold',
  };

  const getStatusIcon = () => {
    switch (status) {
      case COMPLAINT_STATUS.OPEN:
        return <AlertCircle className="w-3.5 h-3.5 mr-1.5 text-blue-500" />;
      case COMPLAINT_STATUS.ASSIGNED:
        return <UserCheck className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />;
      case COMPLAINT_STATUS.ACCEPTED:
        return <Clock className="w-3.5 h-3.5 mr-1.5 text-cyan-500" />;
      case COMPLAINT_STATUS.IN_PROGRESS:
        return <Play className="w-3.5 h-3.5 mr-1.5 text-amber-500" />;
      case COMPLAINT_STATUS.RESOLVED:
        return <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-500" />;
      case COMPLAINT_STATUS.CLOSED:
        return <Check className="w-3.5 h-3.5 mr-1.5 text-slate-500" />;
      case COMPLAINT_STATUS.CANCELLED:
        return <XCircle className="w-3.5 h-3.5 mr-1.5 text-rose-500" />;
      case COMPLAINT_STATUS.REOPENED:
        return <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-orange-500" />;
      default:
        return null;
    }
  };

  const colorClass = STATUS_COLORS[status] || 'bg-slate-100 text-slate-700 border-slate-200';
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border shadow-sm ${colorClass} ${
        sizeClasses[size] || sizeClasses.md
      }`}
    >
      {getStatusIcon()}
      {label}
    </span>
  );
};

export default ComplaintStatusBadge;
