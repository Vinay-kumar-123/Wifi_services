import React from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  MapPin,
  Phone,
  User,
  Wrench,
  ChevronRight,
  UserPlus,
  Paperclip,
  Clock,
} from 'lucide-react';
import ComplaintStatusBadge from './ComplaintStatusBadge';
import ComplaintPriorityBadge from './ComplaintPriorityBadge';

export const AdminComplaintTable = ({
  complaints = [],
  onOpenAssignModal,
}) => {
  const formatTimestamp = (ts) => {
    if (!ts) return 'Unknown';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return format(date, 'MMM d, h:mm a');
    } catch {
      return 'Recent';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <th className="py-3 px-4">Ticket</th>
              <th className="py-3 px-4">Customer & Location</th>
              <th className="py-3 px-4">Category & Priority</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Assigned Technician</th>
              <th className="py-3 px-4">Logged</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {complaints.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                {/* Ticket ID & Attachments */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      #{item.id.slice(0, 8)}
                    </span>
                    {item.attachments && item.attachments.length > 0 && (
                      <span className="text-slate-400" title={`${item.attachments.length} attachments`}>
                        <Paperclip className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </td>

                {/* Customer Info & Address */}
                <td className="py-3 px-4">
                  <div className="max-w-[200px]">
                    <p className="font-semibold text-slate-900 truncate">
                      {item.customerName || 'Customer'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate flex items-center mt-0.5">
                      <Phone className="w-3 h-3 mr-1 text-slate-400" />
                      {item.phone}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate flex items-center mt-0.5" title={item.address}>
                      <MapPin className="w-3 h-3 mr-1 text-slate-400 flex-shrink-0" />
                      <span className="truncate">{item.address}</span>
                    </p>
                  </div>
                </td>

                {/* Category & Priority */}
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-800">{item.category}</p>
                    <ComplaintPriorityBadge priority={item.priority} size="sm" />
                  </div>
                </td>

                {/* Status */}
                <td className="py-3 px-4 whitespace-nowrap">
                  <ComplaintStatusBadge status={item.status} size="sm" />
                </td>

                {/* Assigned Technician & Manual Dispatch Button */}
                <td className="py-3 px-4">
                  {item.assignedTechnicianName ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                        {item.assignedTechnicianName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-800 truncate max-w-[120px]">
                        {item.assignedTechnicianName}
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenAssignModal(item)}
                        className="text-[10px] font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 hover:bg-sky-100"
                        title="Reassign Technician"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenAssignModal(item)}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors shadow-2xs"
                    >
                      <UserPlus className="w-3.5 h-3.5 mr-1 text-amber-600" />
                      Assign Tech
                    </button>
                  )}
                </td>

                {/* Logged Date */}
                <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                  {formatTimestamp(item.createdAt)}
                </td>

                {/* Action Link */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <Link
                    to={`/admin/complaints/${item.id}`}
                    className="inline-flex items-center font-semibold text-sky-600 hover:text-sky-700 px-3 py-1.5 rounded-lg hover:bg-sky-50 transition-colors"
                  >
                    Manage
                    <ChevronRight className="w-4 h-4 ml-0.5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-slate-100">
        {complaints.map((item) => (
          <div key={item.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  #{item.id.slice(0, 8)}
                </span>
                <ComplaintPriorityBadge priority={item.priority} size="sm" />
              </div>
              <ComplaintStatusBadge status={item.status} size="sm" />
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900">{item.category}</h4>
              <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{item.description}</p>
            </div>

            <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-2.5 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">{item.customerName}</span>
                <span>{item.phone}</span>
              </div>
              <p className="text-[11px] truncate flex items-center text-slate-400">
                <MapPin className="w-3 h-3 mr-1" />
                {item.address}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                {item.assignedTechnicianName ? (
                  <div className="flex items-center space-x-1.5 text-xs text-slate-700">
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-semibold">{item.assignedTechnicianName}</span>
                    <button
                      onClick={() => onOpenAssignModal(item)}
                      className="text-[10px] text-sky-600 underline ml-1"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onOpenAssignModal(item)}
                    className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200"
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    Assign Tech
                  </button>
                )}
              </div>

              <Link
                to={`/admin/complaints/${item.id}`}
                className="inline-flex items-center text-xs font-bold text-sky-600"
              >
                Manage
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminComplaintTable;
