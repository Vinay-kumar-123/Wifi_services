import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Phone,
  Mail,
  User,
  Paperclip,
  Download,
  AlertCircle,
  XCircle,
  Wrench,
  CheckCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeToComplaint,
  subscribeToComplaintHistory,
  cancelComplaint,
} from '@/services/complaints/complaintService';
import ComplaintStatusBadge from '@/components/complaints/ComplaintStatusBadge';
import ComplaintPriorityBadge from '@/components/complaints/ComplaintPriorityBadge';
import ComplaintTimeline from '@/components/complaints/ComplaintTimeline';
import ComplaintHistoryList from '@/components/complaints/ComplaintHistoryList';
import ConfirmModal from '@/components/common/ConfirmModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { COMPLAINT_STATUS } from '@/constants/complaintStatus';

export const ComplaintDetailPage = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cancellation Modal State
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Real-time listener for the complaint
    const unsubscribeComplaint = subscribeToComplaint(
      id,
      (data) => {
        if (!data) {
          setError('Complaint not found or you do not have permission to view it.');
        } else {
          // Ownership verification
          if (data.customerId !== currentUser?.uid) {
            setError('Access Denied: This ticket belongs to another customer.');
          } else {
            setComplaint(data);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error('Complaint listener error:', err);
        setError('Error loading complaint details. Please try again.');
        setLoading(false);
      }
    );

    // Real-time listener for complaint history subcollection
    const unsubscribeHistory = subscribeToComplaintHistory(
      id,
      (records) => {
        setHistory(records);
        setHistoryLoading(false);
      },
      (err) => {
        console.warn('History listener error:', err);
        setHistoryLoading(false);
      }
    );

    return () => {
      unsubscribeComplaint();
      unsubscribeHistory();
    };
  }, [id, currentUser?.uid]);

  const handleCancelComplaint = async () => {
    if (!complaint || complaint.status !== COMPLAINT_STATUS.OPEN) return;

    try {
      setCancelling(true);
      await cancelComplaint(complaint.id, currentUser, cancelReason);
      toast.success('Complaint successfully cancelled.');
      setCancelModalOpen(false);
      setCancelReason('');
    } catch (err) {
      console.error('Error cancelling complaint:', err);
      toast.error(err.message || 'Failed to cancel complaint.');
    } finally {
      setCancelling(false);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Unknown';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return format(date, 'MMMM d, yyyy · h:mm a');
    } catch {
      return 'Recent';
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen label="Loading complaint tracking..." />;
  }

  if (error || !complaint) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Unable to View Ticket</h2>
          <p className="text-sm text-slate-600">{error || 'Complaint record not available.'}</p>
          <div className="pt-2">
            <Link
              to="/customer/complaints"
              className="inline-flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Complaints
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const canCancel = complaint.status === COMPLAINT_STATUS.OPEN;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/customer/complaints"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white transition-colors border border-transparent hover:border-slate-200"
            title="Back to Complaints"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Ticket #{complaint.id.slice(0, 8)}
              </h1>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                ({complaint.id})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Logged on {formatTimestamp(complaint.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Button: Customer Cancel (Open tickets only) */}
        {canCancel && (
          <button
            type="button"
            onClick={() => setCancelModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold shadow-sm transition-colors"
          >
            <XCircle className="w-4 h-4 mr-1.5 text-rose-600" />
            Cancel Ticket
          </button>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* Main content column */}
        <div className="min-w-0 space-y-6">
          {/* Ticket Overview Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Category
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">{complaint.category}</h3>
              </div>
              <div className="flex items-center space-x-2">
                <ComplaintStatusBadge status={complaint.status} size="md" />
                <ComplaintPriorityBadge priority={complaint.priority} size="md" />
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Issue Description
              </span>
              <p className="mt-1.5 text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                {complaint.description}
              </p>
            </div>

            {/* Location & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-500">Service Location</span>
                  <p className="text-slate-800 font-medium mt-0.5">{complaint.address}</p>
                </div>
              </div>

              <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-start space-x-2.5">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-500">Contact Method</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {complaint.phone} ({complaint.preferredContactMethod || 'phone'})
                  </p>
                </div>
              </div>
            </div>

            {/* Attachments */}
            {complaint.attachments && complaint.attachments.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Attachments ({complaint.attachments.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {complaint.attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-xs hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {file.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Download Attachment"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Assigned Technician Banner */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center">
              <Wrench className="w-4 h-4 mr-2 text-amber-600" />
              Assigned Field Technician
            </h3>
            {complaint.assignedTechnicianName ? (
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-sm">
                    {complaint.assignedTechnicianName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {complaint.assignedTechnicianName}
                    </h4>
                    <p className="text-xs text-amber-800">
                      Authorized broadband technician dispatched to your ticket
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-white text-amber-800 border border-amber-200 shadow-xs">
                  Active Tech
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>
                  This complaint is pending manual technician assignment by our operations administration team. You will see technician details here as soon as dispatched.
                </span>
              </div>
            )}
          </div>

          {/* Resolution Notes Section (If Resolved or Closed) */}
          {(complaint.status === COMPLAINT_STATUS.RESOLVED ||
            complaint.status === COMPLAINT_STATUS.CLOSED) && (
            <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Technician Resolution Report
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-emerald-900 bg-white p-4 rounded-xl border border-emerald-100 leading-relaxed whitespace-pre-line shadow-xs">
                {complaint.resolutionNotes || 'Technician resolved the service issue.'}
              </p>
              {complaint.resolvedAt && (
                <p className="text-[11px] text-emerald-700 font-medium">
                  Resolved on: {formatTimestamp(complaint.resolvedAt)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar: Visual Timeline & Chronological History */}
        <aside className="min-w-0 space-y-6">
          {/* Visual Progress Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <ComplaintTimeline complaint={complaint} />
          </div>

          {/* Real-time Activity History Subcollection */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-sky-600" />
              Activity & Status History
            </h3>
            <ComplaintHistoryList history={history} loading={historyLoading} />
          </div>
        </aside>
      </div>

      {/* Confirmation Modal for Customer Cancellation */}
      <ConfirmModal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelComplaint}
        title="Cancel Complaint Ticket"
        message="Are you sure you want to cancel this complaint? Once cancelled, our technical team will not dispatch a technician."
        confirmText="Confirm Cancellation"
        cancelText="Keep Ticket Open"
        isDestructive={true}
        isLoading={cancelling}
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for cancellation (optional):
          </label>
          <textarea
            rows={2}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="e.g. Internet restored automatically, router restarted..."
            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      </ConfirmModal>
    </div>
  );
};

export default ComplaintDetailPage;
