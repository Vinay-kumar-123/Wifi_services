import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  ClipboardList,
  AlertOctagon,
  Clock,
  CheckCircle2,
  Lock,
  Play,
  UserCheck,
  AlertCircle,
  Wrench,
  ChevronRight,
  TrendingDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getAdminMetrics,
  getAdminComplaints,
} from '@/services/complaints/complaintService';
import {
  getActiveTechniciansWithWorkload,
  getUserStats,
} from '@/services/users/userService';
import AdminComplaintTable from '@/components/complaints/AdminComplaintTable';
import AssignTechnicianModal from '@/components/complaints/AssignTechnicianModal';

export const AdminDashboardPage = () => {
  const { userProfile } = useAuth();

  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    assigned: 0,
    accepted: 0,
    inProgress: 0,
    resolved: 0,
    closed: 0,
    critical: 0,
  });

  const [userStats, setUserStats] = useState({
    totalCustomers: 0,
    totalTechnicians: 0,
  });

  const [unassignedTickets, setUnassignedTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);

  // Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [adminMetrics, uStats, unassignedData, techData] = await Promise.all([
        getAdminMetrics(),
        getUserStats(),
        getAdminComplaints({ status: 'open', pageSize: 5 }),
        getActiveTechniciansWithWorkload(),
      ]);

      setMetrics(adminMetrics);
      setUserStats(uStats);
      setUnassignedTickets(unassignedData.complaints);
      setTechnicians(techData);
    } catch (err) {
      console.error('Error loading admin dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleOpenAssignModal = (complaint) => {
    setSelectedComplaint(complaint);
    setAssignModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* Top Operations Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-800 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-purple-200">
                NOC Operations & Admin Suite
              </span>
              <span className="flex items-center text-xs text-purple-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Super Administrator
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              Network Operations Center
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-purple-200 max-w-2xl leading-relaxed">
              Real-time monitoring of all broadband complaint queues, active field technician capacities, and incident resolution SLAs.
            </p>
          </div>

          <Link
            to="/admin/complaints"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-white text-purple-900 hover:bg-purple-50 font-bold text-sm shadow-md transition-all whitespace-nowrap"
          >
            <ClipboardList className="w-4 h-4 mr-2" />
            Open Master Queue
          </Link>
        </div>
      </div>

      {/* 8 Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Open (Unassigned) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Open / Queued
            </p>
            <p className="text-2xl font-bold text-blue-600 mt-1">
              {loading ? '-' : metrics.open}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Pending assignment</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Assigned */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Assigned
            </p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {loading ? '-' : metrics.assigned}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Dispatched to tech</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Accepted */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Accepted
            </p>
            <p className="text-2xl font-bold text-cyan-600 mt-1">
              {loading ? '-' : metrics.accepted}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Tech acknowledged</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* 4. In Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              In Progress
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {loading ? '-' : metrics.inProgress}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Fieldwork underway</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Play className="w-5 h-5" />
          </div>
        </div>

        {/* 5. Resolved */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Resolved
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {loading ? '-' : metrics.resolved}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Awaiting admin closure</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* 6. Closed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Closed
            </p>
            <p className="text-2xl font-bold text-slate-700 mt-1">
              {loading ? '-' : metrics.closed}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Archived & verified</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        {/* 7. Critical Priority Alert */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Critical Priority
            </p>
            <p className="text-2xl font-bold text-rose-600 mt-1">
              {loading ? '-' : metrics.critical}
            </p>
            <p className="text-[11px] text-rose-500 mt-0.5">High SLA sensitivity</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center animate-pulse">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        {/* 8. Active Personnel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Field Technicians
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '-' : userStats.totalTechnicians}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {userStats.totalCustomers} total customers
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid: Unassigned Queue & Technician Workload Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Unassigned Complaints Requiring Action */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Pending Technician Dispatch
              </h2>
              <p className="text-xs text-slate-500">
                New complaints in <span className="font-semibold text-blue-600">Open</span> status requiring manual technician assignment
              </p>
            </div>

            <Link
              to="/admin/complaints?status=open"
              className="inline-flex items-center text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              View all ({metrics.open})
              <ChevronRight className="w-4 h-4 ml-0.5" />
            </Link>
          </div>

          {loading ? (
            <div className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse"></div>
          ) : unassignedTickets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Queue is Clear!</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                All open complaints have been dispatched to technicians. Monitor active tasks in the complaint queue.
              </p>
            </div>
          ) : (
            <AdminComplaintTable
              complaints={unassignedTickets}
              onOpenAssignModal={handleOpenAssignModal}
            />
          )}
        </div>

        {/* Right 1 Column: Technician Live Workload & Capacity */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Technician Capacity</h2>
              <p className="text-xs text-slate-500">Live active ticket distribution</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            {loading ? (
              <div className="h-40 bg-slate-50 rounded-xl animate-pulse"></div>
            ) : technicians.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                <Wrench className="w-8 h-8 mx-auto text-slate-400 mb-1.5" />
                <p className="font-semibold">No active technicians registered.</p>
                <p className="text-slate-400 mt-0.5">
                  Promote users to technicians in User Management.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {technicians.map((tech, index) => (
                  <div
                    key={tech.uid}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {tech.displayName ? tech.displayName.charAt(0).toUpperCase() : 'T'}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {tech.displayName || 'Technician'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{tech.email}</p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        tech.activeWorkload === 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : tech.activeWorkload <= 2
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {tech.activeWorkload} active
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Assignment Modal */}
      {selectedComplaint && (
        <AssignTechnicianModal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setSelectedComplaint(null);
          }}
          complaint={selectedComplaint}
          onSuccess={loadDashboardData}
        />
      )}
    </div>
  );
};

export default AdminDashboardPage;
