import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  MapPin,
  Phone,
  User,
  ExternalLink,
  ChevronRight,
  Clock,
  Play,
  CheckCircle2,
  Check,
  FileText,
  Paperclip,
} from 'lucide-react';
import ComplaintStatusBadge from './ComplaintStatusBadge';
import ComplaintPriorityBadge from './ComplaintPriorityBadge';
import { COMPLAINT_STATUS } from '@/constants/complaintStatus';

export const TechnicianComplaintCard = ({
  complaint,
  onAccept,
  onStartWork,
  onResolve,
  onAddNote,
  actionLoading = false,
}) => {
  const formatTimestamp = (ts) => {
    if (!ts) return 'Unknown';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return format(date, 'MMM d, yyyy · h:mm a');
    } catch {
      return 'Recent';
    }
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    complaint.address || ''
  )}`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all space-y-4">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
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

      {/* Incident Details */}
      <div>
        <h4 className="text-base font-bold text-slate-900">{complaint.category}</h4>
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mt-1 leading-relaxed">
          {complaint.description}
        </p>
      </div>

      {/* Customer Contact & Location Box */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 font-bold text-slate-800">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span>{complaint.customerName}</span>
          </div>
          <a
            href={`tel:${complaint.phone}`}
            className="inline-flex items-center font-bold text-sky-600 hover:text-sky-700 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs"
          >
            <Phone className="w-3 h-3 mr-1 text-sky-500" />
            {complaint.phone}
          </a>
        </div>

        <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-200/60">
          <div className="flex items-start space-x-1.5 text-slate-600 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="truncate">{complaint.address}</span>
          </div>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-[11px] font-semibold text-slate-600 hover:text-slate-900 whitespace-nowrap"
            title="Open in Google Maps"
          >
            Maps
            <ExternalLink className="w-3 h-3 ml-1 text-slate-400" />
          </a>
        </div>
      </div>

      {/* Technician Action Buttons & Link */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-2">
          {/* Action 1: Accept Assignment (assigned -> accepted) */}
          {complaint.status === COMPLAINT_STATUS.ASSIGNED && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onAccept(complaint)}
              className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5 mr-1.5" />
              Accept Assignment
            </button>
          )}

          {/* Action 2: Start Work (accepted -> in_progress) */}
          {complaint.status === COMPLAINT_STATUS.ACCEPTED && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => onStartWork(complaint)}
              className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Start Investigation
            </button>
          )}

          {/* Action 3: In-Progress Actions (Add work note & Mark as Resolved) */}
          {complaint.status === COMPLAINT_STATUS.IN_PROGRESS && (
            <>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => onAddNote(complaint)}
                className="inline-flex items-center px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                Add Log
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => onResolve(complaint)}
                className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Mark Resolved
              </button>
            </>
          )}

          {/* Status 4: Resolved */}
          {complaint.status === COMPLAINT_STATUS.RESOLVED && (
            <span className="inline-flex items-center text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              Resolved · Pending Admin Closure
            </span>
          )}
        </div>

        <Link
          to={`/technician/complaints/${complaint.id}`}
          className="inline-flex items-center text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
        >
          View Ticket
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </Link>
      </div>
    </div>
  );
};

export default TechnicianComplaintCard;
