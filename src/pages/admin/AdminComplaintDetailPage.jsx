import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Wrench,
  MapPin,
  Phone,
  Mail,
  User,
  Paperclip,
  Download,
  AlertCircle,
  CheckCircle2,
  Lock,
  RotateCcw,
  Save,
  Loader2,
  FileText,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeToComplaint,
  subscribeToComplaintHistory,
  updateComplaintInternalNotes,
  closeComplaintByAdmin,
} from '@/services/complaints/complaintService';
import ComplaintStatusBadge from '@/components/complaints/ComplaintStatusBadge';
import ComplaintPriorityBadge from '@/components/complaints/ComplaintPriorityBadge';
import ComplaintTimeline from '@/components/complaints/ComplaintTimeline';
import ComplaintHistoryList from '@/components/complaints/ComplaintHistoryList';
import AssignTechnicianModal from '@/components/complaints/AssignTechnicianModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { COMPLAINT_STATUS } from '@/constants/complaintStatus';

export const AdminComplaintDetailPage = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);

  // Internal Notes State
  const [internalNotes, setInternalNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  // Close Ticket Modal State
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [closureNote, setClosureNote] = useState('');
  const [closingTicket, setClosingTicket] = useState(false);

  useEffect(() => {
    if (!id) return;

    const unsubscribeComplaint = subscribeToComplaint(
      id,
      (data) => {
        if (!data) {
          setError('Complaint record not found.');
        } else {
          setComplaint(data);
          setInternalNotes(data.internalNotes || '');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error in complaint listener:', err);
        setError('Error loading complaint details.');
        setLoading(false);
      }
    );

    const unsubscribeHistory = subscribeToComplaintHistory(
      id,
      (records) => {
        setHistory(records);
        setHistoryLoading(false);
      },
      (err) => {
        console.warn('Error in history listener:', err);
        setHistoryLoading(false);
      }
    );

    return () => {
      unsubscribeComplaint();
      unsubscribeHistory();
    };
  }, [id]);

  const handleSaveInternalNotes = async () => {
    try {
      setSavingNotes(true);
      await updateComplaintInternalNotes(complaint.id, internalNotes, currentUser);
      toast.success('Internal operational notes updated.');
    } catch (err) {
      console.error('Error saving notes:', err);
      toast.error('Failed to update internal notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleCloseComplaint = async () => {
    try {
      setClosingTicket(true);
      await closeComplaintByAdmin(complaint.id, currentUser, closureNote);
      toast.success('Complaint ticket verified and formally closed.');
      setCloseModalOpen(false);
      setClosureNote('');
    } catch (err) {
      console.error('Error closing complaint:', err);
      toast.error(err.message || 'Failed to close complaint.');
    } finally {
      setClosingTicket(false);
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
    return <LoadingSpinner fullScreen label="Loading administration view..." />;
  }

  if (error || !complaint) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Complaint Not Found</h2>
          <p className="text-xs sm:text-sm text-slate-600">{error || 'Unable to locate ticket record.'}</p>
          <Link
            to="/admin/complaints"
            className="inline-flex items-center px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Master Queue
          </Link>
        </div>
      </div>
    );
  }

  const isClosed = complaint.status === COMPLAINT_STATUS.CLOSED;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/complaints"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white transition-colors border border-transparent hover:border-slate-200"
            title="Back to Master Queue"
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

        {/* Action Controls: Close Ticket or Reassign */}
        <div className="flex items-center space-x-2.5">
          <button
            type="button"
            onClick={() => setAssignModalOpen(true)}
            className="inline-flex items-center px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition-colors shadow-2xs"
          >
            <Wrench className="w-4 h-4 mr-1.5 text-amber-600" />
            {complaint.assignedTechnicianName ? 'Reassign Tech' : 'Assign Tech'}
          </button>

          {!isClosed && (
            <button
              type="button"
              onClick={() => setCloseModalOpen(true)}
              className="inline-flex items-center px-3.5 py-2 rounded-xl border border-slate-300 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <Lock className="w-4 h-4 mr-1.5 text-slate-300" />
              Close Ticket
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Complaint & Customer Management */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Category
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  {complaint.category}
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <ComplaintStatusBadge status={complaint.status} size="md" />
                <ComplaintPriorityBadge priority={complaint.priority} size="md" />
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Customer Issue Description
              </span>
              <p className="mt-1.5 text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                {complaint.description}
              </p>
            </div>

            {/* Customer Details Box */}
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Customer & Location Record
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-start space-x-2.5">
                  <User className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-500">Customer Name</span>
                    <p className="text-slate-800 font-bold mt-0.5">{complaint.customerName}</p>
                    <p className="text-slate-400 text-[11px]">{complaint.customerEmail}</p>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-start space-x-2.5">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-500">Phone & Preference</span>
                    <p className="text-slate-800 font-bold mt-0.5">{complaint.phone}</p>
                    <p className="text-slate-400 text-[11px] capitalize">
                      Preferred: {complaint.preferredContactMethod || 'phone'}
                    </p>
                  </div>
                </div>

                <div className="sm:col-span-2 p-3 bg-slate-50/70 rounded-xl border border-slate-100 flex items-start space-x-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-500">Installation Address</span>
                    <p className="text-slate-800 font-medium mt-0.5">{complaint.address}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments */}
            {complaint.attachments && complaint.attachments.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  Customer Attachments ({complaint.attachments.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {complaint.attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between shadow-2xs hover:border-slate-300 transition-colors"
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

          {/* Assigned Technician Management Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center">
                <Wrench className="w-4 h-4 mr-2 text-amber-600" />
                Assigned Field Technician
              </h3>
              <button
                type="button"
                onClick={() => setAssignModalOpen(true)}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline"
              >
                {complaint.assignedTechnicianName ? 'Change Technician' : 'Manual Dispatch'}
              </button>
            </div>

            {complaint.assignedTechnicianName ? (
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-sm">
                    {complaint.assignedTechnicianName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {complaint.assignedTechnicianName}
                    </h4>
                    <p className="text-xs text-amber-800 font-mono">
                      Tech UID: {complaint.assignedTechnicianId}
                    </p>
                    {complaint.assignedAt && (
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Dispatched on: {formatTimestamp(complaint.assignedAt)}
                      </p>
                    )}
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white text-amber-800 border border-amber-200 shadow-2xs">
                  Active Dispatch
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>
                    No technician currently assigned. This ticket is in the unassigned queue.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-2xs"
                >
                  Assign Now
                </button>
              </div>
            )}
          </div>

          {/* Technician Resolution Report (if filled) */}
          {complaint.resolutionNotes && (
            <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-6 shadow-sm space-y-2">
              <div className="flex items-center space-x-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Field Technician Resolution Notes
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-emerald-900 bg-white p-4 rounded-xl border border-emerald-100 whitespace-pre-line shadow-2xs">
                {complaint.resolutionNotes}
              </p>
              {complaint.resolvedAt && (
                <p className="text-[11px] text-emerald-700">
                  Completed on: {formatTimestamp(complaint.resolvedAt)}
                </p>
              )}
            </div>
          )}

          {/* Internal Operations Notes Editor */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-2 text-purple-600" />
                Internal Operational Notes (Confidential)
              </h3>
              <span className="text-[11px] text-slate-400">
                Visible only to NOC Administrators
              </span>
            </div>

            <textarea
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Record internal diagnostic notes, ISP port info, dispatch caveats, or escalation comments..."
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveInternalNotes}
                disabled={savingNotes}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {savingNotes ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                    Save Internal Notes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Visual Timeline & Activity Audit Stream */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <ComplaintTimeline complaint={complaint} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-sky-600" />
              Real-Time Activity Audit Trail
            </h3>
            <ComplaintHistoryList history={history} loading={historyLoading} />
          </div>
        </div>
      </div>

      {/* Manual Assignment Modal */}
      <AssignTechnicianModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        complaint={complaint}
      />

      {/* Ticket Closure Confirmation Modal */}
      <ConfirmModal
        isOpen={closeModalOpen}
        onClose={() => setCloseModalOpen(false)}
        onConfirm={handleCloseComplaint}
        title="Verify & Close Complaint Ticket"
        message="Are you sure you want to mark this ticket as Closed? The ticket will be archived as completed and logged in operational audit records."
        confirmText="Confirm Ticket Closure"
        cancelText="Keep Open"
        isDestructive={false}
        isLoading={closingTicket}
      >
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Closure Verification Notes (optional):
          </label>
          <textarea
            rows={2}
            value={closureNote}
            onChange={(e) => setClosureNote(e.target.value)}
            placeholder="e.g. Confirmed restored with customer via phone, speed test 100Mbps verified..."
            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </ConfirmModal>
    </div>
  );
};

export default AdminComplaintDetailPage;
