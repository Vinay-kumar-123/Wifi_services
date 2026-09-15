import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  MapPin,
  Phone,
  UserCheck,
  ChevronRight,
  Clock,
  FileText,
  Paperclip,
} from 'lucide-react';
import ComplaintStatusBadge from './ComplaintStatusBadge';
import ComplaintPriorityBadge from './ComplaintPriorityBadge';

export const ComplaintCard = ({ complaint }) => {
  const formatTimestamp = (ts) => {
    if (!ts) return 'Unknown';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return format(date, 'MMM d, yyyy · h:mm a');
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            #{complaint.id.slice(0, 8)}
          </span>
          <ComplaintStatusBadge status={complaint.status} size="sm" />
          <ComplaintPriorityBadge priority={complaint.priority} size="sm" />
          {complaint.attachments && complaint.attachments.length > 0 && (
            <span className="inline-flex items-center text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
              <Paperclip className="w-3 h-3 mr-1 text-slate-400" />
              {complaint.attachments.length}
            </span>
          )}
        </div>

        <div className="flex items-center text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
          <span>{formatTimestamp(complaint.createdAt)}</span>
        </div>
      </div>

      <div className="py-3">
        <h4 className="text-base font-bold text-slate-900 mb-1">
          {complaint.category}
        </h4>
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
          {complaint.description}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
        <div className="flex items-center truncate">
          <MapPin className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{complaint.address}</span>
        </div>
        <div className="flex items-center">
          <Phone className="w-3.5 h-3.5 mr-1.5 text-slate-400 flex-shrink-0" />
          <span>{complaint.phone}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center text-xs">
          <UserCheck className="w-4 h-4 mr-1.5 text-slate-400" />
          {complaint.assignedTechnicianName ? (
            <span className="text-slate-800 font-medium">
              Tech: <span className="text-sky-700 font-semibold">{complaint.assignedTechnicianName}</span>
            </span>
          ) : (
            <span className="text-slate-400 italic">Technician unassigned</span>
          )}
        </div>

        <Link
          to={`/customer/complaints/${complaint.id}`}
          className="inline-flex items-center text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
        >
          View Tracking
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </Link>
      </div>
    </div>
  );
};

export default ComplaintCard;
