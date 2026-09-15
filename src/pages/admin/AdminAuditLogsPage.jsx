import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  ShieldCheck,
  Search,
  Filter,
  RotateCcw,
  Clock,
  User,
  FileText,
  AlertCircle,
  Loader2,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { getAuditLogs } from '@/services/audit/auditService';
import { getFirestoreErrorMessage } from '@/utils/firebaseErrors';
import { ROLE_COLORS, ROLE_LABELS } from '@/constants/roles';

export const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [targetTypeFilter, setTargetTypeFilter] = useState('all');

  // Pagination
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchAuditLogs = useCallback(
    async (isInitial = true) => {
      try {
        if (isInitial) {
          setLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const res = await getAuditLogs({
          action: actionFilter,
          targetType: targetTypeFilter,
          pageSize: 20,
          lastVisibleDoc: isInitial ? null : lastDoc,
        });

        if (isInitial) {
          setLogs(res.logs);
        } else {
          setLogs((prev) => [...prev, ...res.logs]);
        }

        setLastDoc(res.lastDoc);
        setHasMore(res.hasMore);
      } catch (err) {
        console.error('[AdminAuditLogsPage] Error fetching audit logs:', err);
        setError(getFirestoreErrorMessage(err, 'load audit logs'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [actionFilter, targetTypeFilter, lastDoc]
  );

  useEffect(() => {
    fetchAuditLogs(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionFilter, targetTypeFilter]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setActionFilter('all');
    setTargetTypeFilter('all');
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Unknown';
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return format(date, 'MMM d, yyyy · h:mm:ss a');
    } catch {
      return 'Recent';
    }
  };

  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'ROLE_CHANGED':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'USER_STATUS_TOGGLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'TECHNICIAN_ASSIGNED':
      case 'TECHNICIAN_REASSIGNED':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'COMPLAINT_RESOLVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'COMPLAINT_CLOSED':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'COMPLAINT_CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'USER_REGISTERED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-sky-100 text-sky-800 border-sky-200';
    }
  };

  // Client-side text filter
  const filteredLogs = logs.filter((log) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const actorMatch = log.actorName?.toLowerCase().includes(term);
    const actionMatch = log.action?.toLowerCase().includes(term);
    const targetMatch = log.targetId?.toLowerCase().includes(term);
    const detailsMatch = JSON.stringify(log.metadata || {}).toLowerCase().includes(term);
    return actorMatch || actionMatch || targetMatch || detailsMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Security & Operations Audit Logs
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
              Immutable
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cryptographically sealed and tamper-resistant audit records of all privileged system actions and status changes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchAuditLogs(true)}
          className="inline-flex items-center px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
          Refresh Audit Trail
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search actor, action, target ID, metadata..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="all">All Audit Actions</option>
              <option value="ROLE_CHANGED">ROLE_CHANGED</option>
              <option value="USER_STATUS_TOGGLED">USER_STATUS_TOGGLED</option>
              <option value="USER_REGISTERED">USER_REGISTERED</option>
              <option value="COMPLAINT_CREATED">COMPLAINT_CREATED</option>
              <option value="TECHNICIAN_ASSIGNED">TECHNICIAN_ASSIGNED</option>
              <option value="TECHNICIAN_REASSIGNED">TECHNICIAN_REASSIGNED</option>
              <option value="STATUS_CHANGED">STATUS_CHANGED</option>
              <option value="COMPLAINT_RESOLVED">COMPLAINT_RESOLVED</option>
              <option value="COMPLAINT_CLOSED">COMPLAINT_CLOSED</option>
              <option value="COMPLAINT_CANCELLED">COMPLAINT_CANCELLED</option>
            </select>
          </div>

          {/* Target Type Filter */}
          <div>
            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
            >
              <option value="all">All Target Entities</option>
              <option value="user">User Accounts</option>
              <option value="complaint">Complaints / Tickets</option>
            </select>
          </div>
        </div>

        {(searchTerm !== '' || actionFilter !== 'all' || targetTypeFilter !== 'all') && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>Filtered audit log view</span>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center text-purple-700 hover:text-purple-800 font-semibold"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Audit Log Table */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 bg-white rounded-2xl border border-slate-200 animate-pulse"
            ></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700 space-y-2">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={() => fetchAuditLogs(true)}
            className="text-xs font-semibold underline hover:no-underline"
          >
            Retry Query
          </button>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <Shield className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No audit events found</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            No audit records match your selected criteria.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Audit Metadata & Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {formatTimestamp(log.createdAt)}
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">
                          {log.actorName || 'System'}
                        </span>
                        {log.actorRole && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              ROLE_COLORS[log.actorRole] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {ROLE_LABELS[log.actorRole] || log.actorRole}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${getActionBadgeColor(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-mono text-[11px] text-slate-600">
                        <span className="uppercase text-[10px] font-bold text-slate-400 mr-1">
                          {log.targetType}:
                        </span>
                        <span>#{log.targetId ? log.targetId.slice(0, 10) : 'N/A'}</span>
                      </div>
                    </td>

                    {/* Metadata Diff */}
                    <td className="py-3.5 px-4">
                      <div className="max-w-md text-slate-700">
                        {log.action === 'ROLE_CHANGED' && log.metadata && (
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-500 font-medium">
                              {log.metadata.targetName || log.metadata.targetEmail}:
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                              {log.metadata.fromRole}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800">
                              {log.metadata.toRole}
                            </span>
                          </div>
                        )}

                        {log.action === 'USER_STATUS_TOGGLED' && log.metadata && (
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-500 font-medium">
                              {log.metadata.targetName || log.metadata.targetEmail}:
                            </span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold capitalize bg-slate-100">
                              {log.metadata.fromStatus}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold capitalize ${
                                log.metadata.toStatus === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {log.metadata.toStatus}
                            </span>
                          </div>
                        )}

                        {(log.action === 'TECHNICIAN_ASSIGNED' ||
                          log.action === 'TECHNICIAN_REASSIGNED') &&
                          log.metadata && (
                            <p className="text-[11px]">
                              Dispatched to: <strong>{log.metadata.technicianName}</strong>
                              {log.metadata.previousTechnician && (
                                <span className="text-slate-400">
                                  {' '}
                                  (from {log.metadata.previousTechnician})
                                </span>
                              )}
                              {log.metadata.reason && ` · Note: "${log.metadata.reason}"`}
                            </p>
                          )}

                        {log.action === 'COMPLAINT_RESOLVED' && log.metadata && (
                          <p className="text-[11px] truncate" title={log.metadata.resolutionNotes}>
                            Resolution: &quot;{log.metadata.resolutionNotes}&quot;
                          </p>
                        )}

                        {log.action === 'COMPLAINT_CLOSED' && log.metadata && (
                          <p className="text-[11px]">
                            {log.metadata.closureNotes
                              ? `Verification: "${log.metadata.closureNotes}"`
                              : 'Closed and formally verified.'}
                          </p>
                        )}

                        {log.action === 'COMPLAINT_CANCELLED' && log.metadata && (
                          <p className="text-[11px] text-rose-700">
                            Reason: {log.metadata.reason || 'Cancelled by subscriber.'}
                          </p>
                        )}

                        {log.action === 'USER_REGISTERED' && log.metadata && (
                          <p className="text-[11px] text-slate-500">
                            Registered new subscriber account ({log.metadata.email})
                          </p>
                        )}

                        {log.action === 'COMPLAINT_CREATED' && log.metadata && (
                          <p className="text-[11px] text-slate-500">
                            Category: {log.metadata.category} (Priority: {log.metadata.priority})
                          </p>
                        )}

                        {log.action === 'STATUS_CHANGED' && log.metadata && (
                          <div className="flex items-center space-x-1.5 text-[11px]">
                            <span>{log.metadata.fromStatus}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="font-bold">{log.metadata.toStatus}</span>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden divide-y divide-slate-100">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getActionBadgeColor(
                      log.action
                    )}`}
                  >
                    {log.action}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formatTimestamp(log.createdAt)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{log.actorName}</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {log.targetType}: #{log.targetId?.slice(0, 8)}
                  </span>
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {JSON.stringify(log.metadata || {})}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {hasMore && (
            <div className="text-center p-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => fetchAuditLogs(false)}
                disabled={loadingMore}
                className="inline-flex items-center px-5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-purple-600" />
                    Loading More Audit Records...
                  </>
                ) : (
                  'Load More Audit Logs'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogsPage;
