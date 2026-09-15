import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Wifi,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  getCustomerComplaints,
  getCustomerMetrics,
} from '@/services/complaints/complaintService';
import ComplaintCard from '@/components/complaints/ComplaintCard';

export const CustomerDashboardPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [metrics, setMetrics] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [metricStats, recentData] = await Promise.all([
          getCustomerMetrics(currentUser.uid),
          getCustomerComplaints(currentUser.uid, { pageSize: 3 }),
        ]);

        setMetrics(metricStats);
        setRecentComplaints(recentData.complaints);
      } catch (err) {
        console.error('Error loading customer dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser?.uid]);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-sky-600 via-sky-700 to-indigo-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm text-sky-100">
                Customer Support Portal
              </span>
              <span className="flex items-center text-xs text-sky-200">
                <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Active Account
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, {userProfile?.displayName || 'Customer'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-sky-100 max-w-xl leading-relaxed">
              Report Wi-Fi issues, check network incidents, and follow technician dispatch and resolution updates in real-time.
            </p>
          </div>

          <Link
            to="/customer/new-complaint"
            className="inline-flex items-center px-5 py-2.5 rounded-xl bg-white text-sky-700 hover:bg-sky-50 font-bold text-sm shadow-md transition-all whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Report an Issue
          </Link>
        </div>
      </div>

      {/* Real Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Complaints
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {loading ? '-' : metrics.total}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Open / Queued
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {loading ? '-' : metrics.open}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              In Progress
            </p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {loading ? '-' : metrics.inProgress}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Resolved & Closed
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {loading ? '-' : metrics.resolved}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Complaints Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Recent Service Complaints</h2>
            <p className="text-xs text-slate-500">Your latest logged Wi-Fi service tickets</p>
          </div>

          <Link
            to="/customer/complaints"
            className="inline-flex items-center text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
          >
            View all ({metrics.total})
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse h-28"
              ></div>
            ))}
          </div>
        ) : recentComplaints.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
              <Wifi className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No active complaints</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your broadband connection is running without active complaints. If you experience an outage or speed drop, submit a ticket.
            </p>
            <div className="pt-1">
              <Link
                to="/customer/new-complaint"
                className="inline-flex items-center px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm"
              >
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Submit New Complaint
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {recentComplaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboardPage;
