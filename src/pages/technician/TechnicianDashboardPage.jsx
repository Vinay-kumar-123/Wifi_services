import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Wrench,
  AlertCircle,
  Clock,
  CheckCircle2,
  AlertOctagon,
  RotateCcw,
  Loader2,
  Inbox,
  ShieldCheck,
  Check,
  Play,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getFirestoreErrorMessage } from '@/utils/firebaseErrors';
import {
  getTechnicianComplaints,
  getTechnicianMetrics,
  acceptComplaintByTechnician,
  startWorkByTechnician,
  resolveComplaintByTechnician,
  addWorkNoteByTechnician,
} from '@/services/complaints/complaintService';
import TechnicianComplaintCard from '@/components/complaints/TechnicianComplaintCard';
import ResolveComplaintModal from '@/components/complaints/ResolveComplaintModal';
import WorkNoteModal from '@/components/complaints/WorkNoteModal';

export const TechnicianDashboardPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') || 'assigned';

  const [complaints, setComplaints] = useState([]);
  const [metrics, setMetrics] = useState({
    newAssignments: 0,
    active: 0,
    resolved: 0,
    critical: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal States
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [workNoteModalOpen, setWorkNoteModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser?.uid) return;

    try {
      setLoading(true);
      setError(null);

      const [metricData, complaintData] = await Promise.all([
        getTechnicianMetrics(currentUser.uid),
        getTechnicianComplaints(currentUser.uid, {
          tab: activeTab,
          pageSize: 20,
        }),
      ]);

      setMetrics(metricData);
      setComplaints(complaintData.complaints);
    } catch (err) {
      console.error('[TechnicianDashboard] Error fetching technician data:', err);
      setError(getFirestoreErrorMessage(err, 'load technician tasks'));
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, activeTab]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Action: Accept Assignment
  const handleAccept = async (complaint) => {
    try {
      setActionLoading(true);
      await acceptComplaintByTechnician(complaint.id, currentUser);
      toast.success('Assignment accepted! Ticket moved to Active Tasks.');
      fetchDashboardData();
    } catch (err) {
      console.error('Accept error:', err);
      toast.error(err.message || 'Failed to accept assignment.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Start Work
  const handleStartWork = async (complaint) => {
    try {
      setActionLoading(true);
      await startWorkByTechnician(complaint.id, currentUser);
      toast.success('Investigation started! Status updated to In-Progress.');
      fetchDashboardData();
    } catch (err) {
      console.error('Start work error:', err);
      toast.error(err.message || 'Failed to start work.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Submit Resolution Notes
  const handleConfirmResolve = async (resolutionNotes) => {
    if (!selectedComplaint) return;
    try {
      setActionLoading(true);
      await resolveComplaintByTechnician(selectedComplaint.id, currentUser, resolutionNotes);
      toast.success('Complaint marked as Resolved with technical notes!');
      setResolveModalOpen(false);
      setSelectedComplaint(null);
      fetchDashboardData();
    } catch (err) {
      console.error('Resolve error:', err);
      toast.error(err.message || 'Failed to resolve complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Submit Work Note
  const handleConfirmAddNote = async (workNote) => {
    if (!selectedComplaint) return;
    try {
      setActionLoading(true);
      await addWorkNoteByTechnician(selectedComplaint.id, currentUser, workNote);
      toast.success('Work log appended to complaint history.');
      setWorkNoteModalOpen(false);
      setSelectedComplaint(null);
      fetchDashboardData();
    } catch (err) {
      console.error('Add note error:', err);
      toast.error(err.message || 'Failed to add work note.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTabChange = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-600 via-amber-700 to-slate-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-amber-100">
                Field Technician Console
              </span>
              <span className="flex items-center text-xs text-amber-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Certified Field Agent
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              Technician Workspace: {userProfile?.displayName || 'Agent'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-amber-100 max-w-2xl leading-relaxed">
              Accept dispatches, navigate to subscriber locations, record on-site troubleshooting logs, and submit incident resolution reports.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboardData}
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white text-amber-900 hover:bg-amber-50 font-bold text-xs shadow-md transition-all whitespace-nowrap self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
            Sync Tasks
          </button>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* New Assignments */}
        <button
          onClick={() => handleTabChange('assigned')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeTab === 'assigned'
              ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-500 shadow-sm'
              : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                New Assignments
              </p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {loading ? '-' : metrics.newAssignments}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Requires acceptance</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
        </button>

        {/* Active Tasks */}
        <button
          onClick={() => handleTabChange('active')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeTab === 'active'
              ? 'bg-sky-50/70 border-sky-300 ring-2 ring-sky-500 shadow-sm'
              : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Tasks
              </p>
              <p className="text-2xl font-bold text-sky-600 mt-1">
                {loading ? '-' : metrics.active}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Accepted & In-Progress</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </button>

        {/* Resolved */}
        <button
          onClick={() => handleTabChange('resolved')}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeTab === 'resolved'
              ? 'bg-emerald-50/70 border-emerald-300 ring-2 ring-emerald-500 shadow-sm'
              : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Completed Tickets
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {loading ? '-' : metrics.resolved}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting admin review</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </button>

        {/* Critical Priority */}
        <div className="p-5 rounded-2xl border border-rose-200 bg-white shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Critical Urgency
            </p>
            <p className="text-2xl font-bold text-rose-600 mt-1">
              {loading ? '-' : metrics.critical}
            </p>
            <p className="text-[11px] text-rose-500 mt-0.5">Urgent SLA dispatch</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center animate-pulse">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            type="button"
            onClick={() => handleTabChange('assigned')}
            className={`pb-4 px-1 border-b-2 font-bold text-sm transition-colors flex items-center ${
              activeTab === 'assigned'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <AlertCircle className="w-4 h-4 mr-2 text-amber-600" />
            New Assignments
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800">
              {metrics.newAssignments}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('active')}
            className={`pb-4 px-1 border-b-2 font-bold text-sm transition-colors flex items-center ${
              activeTab === 'active'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <Clock className="w-4 h-4 mr-2 text-sky-600" />
            Active Tasks (Accepted & In-Progress)
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-sky-100 text-sky-800">
              {metrics.active}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('resolved')}
            className={`pb-4 px-1 border-b-2 font-bold text-sm transition-colors flex items-center ${
              activeTab === 'resolved'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
            Completed Tickets
            <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">
              {metrics.resolved}
            </span>
          </button>
        </nav>
      </div>

      {/* Task List Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-3"
            >
              <div className="h-4 bg-slate-200 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700 space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="text-xs font-semibold underline hover:no-underline"
          >
            Retry Loading
          </button>
        </div>
      ) : complaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Inbox className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No complaints in this tab
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            {activeTab === 'assigned'
              ? 'You have no newly assigned tickets awaiting acknowledgment.'
              : activeTab === 'active'
              ? 'You have no active technical investigations in progress.'
              : 'No resolved tickets logged yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {complaints.map((item) => (
            <TechnicianComplaintCard
              key={item.id}
              complaint={item}
              onAccept={handleAccept}
              onStartWork={handleStartWork}
              onResolve={(c) => {
                setSelectedComplaint(c);
                setResolveModalOpen(true);
              }}
              onAddNote={(c) => {
                setSelectedComplaint(c);
                setWorkNoteModalOpen(true);
              }}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* Resolution Notes Modal */}
      {selectedComplaint && (
        <ResolveComplaintModal
          isOpen={resolveModalOpen}
          onClose={() => {
            setResolveModalOpen(false);
            setSelectedComplaint(null);
          }}
          complaint={selectedComplaint}
          onConfirm={handleConfirmResolve}
          isLoading={actionLoading}
        />
      )}

      {/* Work Note Modal */}
      {selectedComplaint && (
        <WorkNoteModal
          isOpen={workNoteModalOpen}
          onClose={() => {
            setWorkNoteModalOpen(false);
            setSelectedComplaint(null);
          }}
          complaint={selectedComplaint}
          onConfirm={handleConfirmAddNote}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
};

export default TechnicianDashboardPage;
