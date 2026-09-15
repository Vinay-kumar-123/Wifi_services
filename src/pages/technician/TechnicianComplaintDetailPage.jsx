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
  ExternalLink,
  Paperclip,
  Download,
  AlertCircle,
  CheckCircle2,
  Check,
  Play,
  FileText,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import {
  subscribeToComplaint,
  subscribeToComplaintHistory,
  acceptComplaintByTechnician,
  startWorkByTechnician,
  resolveComplaintByTechnician,
  addWorkNoteByTechnician,
} from '@/services/complaints/complaintService';
import ComplaintStatusBadge from '@/components/complaints/ComplaintStatusBadge';
import ComplaintPriorityBadge from '@/components/complaints/ComplaintPriorityBadge';
import ComplaintTimeline from '@/components/complaints/ComplaintTimeline';
import ComplaintHistoryList from '@/components/complaints/ComplaintHistoryList';
import ResolveComplaintModal from '@/components/complaints/ResolveComplaintModal';
import WorkNoteModal from '@/components/complaints/WorkNoteModal';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { COMPLAINT_STATUS } from '@/constants/complaintStatus';

export const TechnicianComplaintDetailPage = () => {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [complaint, setComplaint] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [workNoteModalOpen, setWorkNoteModalOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const unsubscribeComplaint = subscribeToComplaint(
      id,
      (data) => {
        if (!data) {
          setError('Complaint record not found.');
        } else {
          // Strict Technician UID Isolation check
          if (data.assignedTechnicianId !== currentUser?.uid) {
            setError('Access Denied: This complaint is not assigned to your technician account.');
          } else {
            setComplaint(data);
          }
        }
        setLoading(false);
      },
      (err) => {
        console.error('Complaint listener error:', err);
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
        console.warn('History listener error:', err);
        setHistoryLoading(false);
      }
    );

    return () => {
      unsubscribeComplaint();
      unsubscribeHistory();
    };
  }, [id, currentUser?.uid]);

  const handleAccept = async () => {
    try {
      setActionLoading(true);
      await acceptComplaintByTechnician(complaint.id, currentUser);
      toast.success('Assignment accepted!');
    } catch (err) {
      console.error('Accept error:', err);
      toast.error(err.message || 'Failed to accept assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartWork = async () => {
    try {
      setActionLoading(true);
      await startWorkByTechnician(complaint.id, currentUser);
      toast.success('Work started! Status updated to In Progress.');
    } catch (err) {
      console.error('Start work error:', err);
      toast.error(err.message || 'Failed to start work.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmResolve = async (resolutionNotes) => {
    try {
      setActionLoading(true);
      await resolveComplaintByTechnician(complaint.id, currentUser, resolutionNotes);
      toast.success('Complaint successfully marked as Resolved!');
      setResolveModalOpen(false);
    } catch (err) {
      console.error('Resolve error:', err);
      toast.error(err.message || 'Failed to resolve ticket.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmAddNote = async (workNote) => {
    try {
      setActionLoading(true);
      await addWorkNoteByTechnician(complaint.id, currentUser, workNote);
      toast.success('Work log appended to complaint history.');
      setWorkNoteModalOpen(false);
    } catch (err) {
      console.error('Add note error:', err);
      toast.error(err.message || 'Failed to add work note.');
    } finally {
      setActionLoading(false);
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
    return <LoadingSpinner fullScreen label="Loading task details..." />;
  }

  if (error || !complaint) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Task Inaccessible</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {error || 'Unable to access complaint record.'}
          </p>
          <div className="pt-2">
            <Link
              to="/technician/dashboard"
              className="inline-flex items-center px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-xl shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Technician Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    complaint.address || ''
  )}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/technician/dashboard"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white transition-colors border border-transparent hover:border-slate-200"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Task #{complaint.id.slice(0, 8)}
              </h1>
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                ({complaint.id})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Assigned to you on {formatTimestamp(complaint.assignedAt || complaint.createdAt)}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {complaint.status === COMPLAINT_STATUS.ASSIGNED && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleAccept}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Accept Assignment
            </button>
          )}

          {complaint.status === COMPLAINT_STATUS.ACCEPTED && (
            <button
              type="button"
              disabled={actionLoading}
              onClick={handleStartWork}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
            >
              <Play className="w-4 h-4 mr-1.5" />
              Start Investigation
            </button>
          )}

          {complaint.status === COMPLAINT_STATUS.IN_PROGRESS && (
            <>
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setWorkNoteModalOpen(true)}
                className="inline-flex items-center px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <FileText className="w-4 h-4 mr-1.5 text-slate-500" />
                Add Work Log
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={() => setResolveModalOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                Mark as Resolved
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscriber & Location Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2">
              Subscriber & Service Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start space-x-2.5">
                <User className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-500">Subscriber Name</span>
                  <p className="text-slate-800 font-bold mt-0.5">{complaint.customerName}</p>
                  <p className="text-slate-400 text-[11px]">{complaint.customerEmail}</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-2">
                <div className="flex items-start space-x-2.5">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-500">Contact Number</span>
                    <p className="text-slate-800 font-bold mt-0.5">{complaint.phone}</p>
                    <p className="text-slate-400 text-[11px] capitalize">
                      Preferred: {complaint.preferredContactMethod || 'phone'}
                    </p>
                  </div>
                </div>
                <a
                  href={`tel:${complaint.phone}`}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-sky-600 rounded-lg font-bold hover:bg-sky-50 shadow-2xs"
                >
                  Call
                </a>
              </div>

              <div className="sm:col-span-2 p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-start justify-between gap-3">
                <div className="flex items-start space-x-2.5">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-500">Physical Address</span>
                    <p className="text-slate-800 font-medium mt-0.5">{complaint.address}</p>
                  </div>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-100 shadow-2xs whitespace-nowrap"
                >
                  Open Maps
                  <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
                </a>
              </div>
            </div>
          </div>

          {/* Incident Details Card */}
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

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Customer Issue Description
              </span>
              <p className="mt-1.5 text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-100">
                {complaint.description}
              </p>
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

          {/* Resolution Report Card (if resolved or closed) */}
          {(complaint.status === COMPLAINT_STATUS.RESOLVED ||
            complaint.status === COMPLAINT_STATUS.CLOSED) && (
            <div className="bg-emerald-50/70 rounded-2xl border border-emerald-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Submitted Technical Resolution Notes
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-emerald-950 bg-white p-4 rounded-xl border border-emerald-100 leading-relaxed whitespace-pre-line shadow-2xs">
                {complaint.resolutionNotes}
              </p>
              {complaint.resolvedAt && (
                <p className="text-[11px] text-emerald-700 font-medium">
                  Completed on: {formatTimestamp(complaint.resolvedAt)}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right 1 Column: Visual Timeline & Activity Audit Logs */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <ComplaintTimeline complaint={complaint} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-sky-600" />
              Activity History & Work Logs
            </h3>
            <ComplaintHistoryList history={history} loading={historyLoading} />
          </div>
        </div>
      </div>

      {/* Resolution Modal */}
      <ResolveComplaintModal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        complaint={complaint}
        onConfirm={handleConfirmResolve}
        isLoading={actionLoading}
      />

      {/* Work Note Modal */}
      <WorkNoteModal
        isOpen={workNoteModalOpen}
        onClose={() => setWorkNoteModalOpen(false)}
        complaint={complaint}
        onConfirm={handleConfirmAddNote}
        isLoading={actionLoading}
      />
    </div>
  );
};

export default TechnicianComplaintDetailPage;
