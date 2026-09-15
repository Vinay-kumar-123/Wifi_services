import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Users,
  RefreshCw,
  Calendar,
  Layers,
  Activity,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { getAdminAnalyticsData } from '@/services/analytics/analyticsService';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const TIMEFRAME_OPTIONS = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'All Time', value: 'all' },
];

export const AdminAnalyticsPage = () => {
  const [timeframe, setTimeframe] = useState('30d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const analyticsResult = await getAdminAnalyticsData(timeframe);
      setData(analyticsResult);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError(err.message || 'Failed to aggregate analytics data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-7 h-7 text-sky-600" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Operational Analytics & Insights
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Real-time incident trends, SLA resolution velocity, and technician performance.
          </p>
        </div>

        {/* Controls: Timeframe selector and Refresh */}
        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {TIMEFRAME_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setTimeframe(option.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  timeframe === option.value
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => fetchAnalytics(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${refreshing ? 'animate-spin text-sky-600' : ''}`} />
            Sync
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => fetchAnalytics()}
            className="text-xs font-semibold text-red-800 underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner label="Aggregating operational analytics..." />
        </div>
      ) : !data || data.totalRecords === 0 ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Activity className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No Incident Records Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            There are no customer complaints recorded for the selected timeframe ({timeframe}).
          </p>
        </div>
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Total Incidents */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Tickets
                </span>
                <Layers className="w-4 h-4 text-slate-400" />
              </div>
              <p className="text-2xl font-bold text-slate-900 mt-2">{data.kpi.total}</p>
              <p className="text-[11px] text-slate-400 mt-1">In selected range</p>
            </div>

            {/* Pending Dispatch (Open) */}
            <div className="bg-white rounded-xl border border-blue-200 p-4 shadow-sm bg-blue-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Pending Dispatch
                </span>
                <AlertTriangle className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-2">{data.kpi.open}</p>
              <p className="text-[11px] text-blue-600 mt-1">Awaiting technician</p>
            </div>

            {/* Field Active */}
            <div className="bg-white rounded-xl border border-cyan-200 p-4 shadow-sm bg-cyan-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-700">
                  In Progress
                </span>
                <Activity className="w-4 h-4 text-cyan-500" />
              </div>
              <p className="text-2xl font-bold text-cyan-900 mt-2">{data.kpi.inProgress}</p>
              <p className="text-[11px] text-cyan-600 mt-1">Under diagnostics</p>
            </div>

            {/* Resolved & Closed */}
            <div className="bg-white rounded-xl border border-emerald-200 p-4 shadow-sm bg-emerald-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                  Resolved / Closed
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-900 mt-2">
                {data.kpi.resolved + data.kpi.closed}
              </p>
              <p className="text-[11px] text-emerald-600 mt-1">
                {data.kpi.closed} verified closed
              </p>
            </div>

            {/* Critical SLA */}
            <div className="bg-white rounded-xl border border-red-200 p-4 shadow-sm bg-red-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-red-700">
                  Critical SLA
                </span>
                <ShieldAlert className="w-4 h-4 text-red-500" />
              </div>
              <p className="text-2xl font-bold text-red-900 mt-2">{data.kpi.critical}</p>
              <p className="text-[11px] text-red-600 mt-1">High-impact outages</p>
            </div>

            {/* Avg Resolution Velocity */}
            <div className="bg-white rounded-xl border border-purple-200 p-4 shadow-sm bg-purple-50/20">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">
                  Avg Turnaround
                </span>
                <Clock className="w-4 h-4 text-purple-500" />
              </div>
              <p className="text-2xl font-bold text-purple-900 mt-2">
                {data.kpi.avgResolutionTimeHours > 0 ? `${data.kpi.avgResolutionTimeHours}h` : 'N/A'}
              </p>
              <p className="text-[11px] text-purple-600 mt-1">From intake to resolved</p>
            </div>
          </div>

          {/* Incident Volume Trend (Area Chart) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Incident Volume Velocity</h3>
                <p className="text-xs text-slate-500">
                  Daily comparison of new complaints reported vs complaints resolved
                </p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-medium">
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-500" />
                  <span className="text-slate-600">Reported Tickets</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">Resolved Tickets</span>
                </div>
              </div>
            </div>

            <div className="mt-4 h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.dailyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="createdGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      borderRadius: '8px',
                      border: 'none',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="created"
                    name="Reported"
                    stroke="#0284c7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#createdGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#resolvedGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grid: Status Distribution & Priority Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown (Donut Chart) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Status Distribution</h3>
                <p className="text-xs text-slate-500">Current state across lifecycle phases</p>
              </div>

              <div className="my-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {data.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-status-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                      formatter={(val) => <span className="text-xs text-slate-700">{val}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                <div className="p-2 rounded-lg bg-blue-50">
                  <span className="text-[10px] uppercase font-bold text-blue-600">Open</span>
                  <p className="text-sm font-bold text-blue-900">{data.kpi.open}</p>
                </div>
                <div className="p-2 rounded-lg bg-cyan-50">
                  <span className="text-[10px] uppercase font-bold text-cyan-600">In Field</span>
                  <p className="text-sm font-bold text-cyan-900">{data.kpi.inProgress}</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50">
                  <span className="text-[10px] uppercase font-bold text-emerald-600">Resolved</span>
                  <p className="text-sm font-bold text-emerald-900">{data.kpi.resolved}</p>
                </div>
              </div>
            </div>

            {/* Priority Breakdown (Bar Chart) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Incident Severity Breakdown</h3>
                <p className="text-xs text-slate-500">Tickets categorized by customer impact level</p>
              </div>

              <div className="my-4 h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.priorityDistribution}
                    margin={{ top: 15, right: 15, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="value" name="Tickets" radius={[6, 6, 0, 0]}>
                      {data.priorityDistribution.map((entry, index) => (
                        <Cell key={`cell-prio-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span>Critical SLA violations monitored 24/7</span>
                <span className="font-semibold text-red-600">{data.kpi.critical} Active Outages</span>
              </div>
            </div>
          </div>

          {/* Category Distribution (Frequency Table / Horizontal Visualization) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Root Issue Category Frequency</h3>
              <p className="text-xs text-slate-500">
                Most frequent network and service failure modes reported by broadband customers
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.categoryDistribution.map((item, idx) => {
                const percent = data.kpi.total > 0 ? Math.round((item.count / data.kpi.total) * 100) : 0;
                return (
                  <div key={item.category} className="p-3 rounded-xl border border-slate-100 bg-slate-50/60">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-800">
                        {idx + 1}. {item.category}
                      </span>
                      <span className="text-slate-600">
                        {item.count} tickets ({percent}%)
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-sky-500 h-2 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Technician Field Workload & Resolution Leaderboard */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Technician Workload & Resolution Leaderboard
                </h3>
                <p className="text-xs text-slate-500">
                  Active load balancing and historical completion rates per technician
                </p>
              </div>
              <div className="text-xs font-medium text-slate-500">
                Active = Assigned / In-Progress &bull; Completed = Resolved / Closed
              </div>
            </div>

            {data.technicianPerformance.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-6">
                No active technicians registered in the system.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 uppercase text-[10px] font-bold tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3 rounded-l-lg">Technician</th>
                      <th className="px-4 py-3">Active Tickets</th>
                      <th className="px-4 py-3">Completed Tickets</th>
                      <th className="px-4 py-3 rounded-r-lg">Load Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.technicianPerformance.map((tech) => {
                      let loadColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      let loadText = 'Optimal Load';

                      if (tech.activeTickets >= 5) {
                        loadColor = 'bg-red-50 text-red-700 border-red-200';
                        loadText = 'High Load';
                      } else if (tech.activeTickets >= 3) {
                        loadColor = 'bg-amber-50 text-amber-700 border-amber-200';
                        loadText = 'Moderate Load';
                      }

                      return (
                        <tr key={tech.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-[10px]">
                                {tech.name.charAt(0).toUpperCase()}
                              </div>
                              <span>{tech.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {tech.activeTickets}
                          </td>
                          <td className="px-4 py-3 font-semibold text-emerald-600">
                            {tech.resolvedTickets}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${loadColor}`}
                            >
                              {loadText}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminAnalyticsPage;
