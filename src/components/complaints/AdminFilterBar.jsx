import React from 'react';
import { Search, Filter, RotateCcw, ArrowUpDown } from 'lucide-react';
import {
  COMPLAINT_STATUS,
  STATUS_LABELS,
  COMPLAINT_PRIORITIES,
  PRIORITY_LABELS,
  COMPLAINT_CATEGORIES,
} from '@/constants/complaintStatus';

export const AdminFilterBar = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  priorityFilter,
  onPriorityChange,
  categoryFilter,
  onCategoryChange,
  technicianFilter,
  onTechnicianChange,
  technicians = [],
  sortOrder,
  onSortOrderChange,
  onResetFilters,
}) => {
  const hasActiveFilters =
    searchTerm !== '' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    categoryFilter !== 'all' ||
    technicianFilter !== 'all' ||
    sortOrder !== 'desc';

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {/* Search input */}
        <div className="relative xl:col-span-2">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search customer, phone, ID, address..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Status dropdown */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="all">All Statuses</option>
            {Object.values(COMPLAINT_STATUS).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status] || status}
              </option>
            ))}
          </select>
        </div>

        {/* Priority dropdown */}
        <div>
          <select
            value={priorityFilter}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="all">All Priorities</option>
            {Object.values(COMPLAINT_PRIORITIES).map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority] || priority}
              </option>
            ))}
          </select>
        </div>

        {/* Category dropdown */}
        <div>
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white truncate"
          >
            <option value="all">All Categories</option>
            {COMPLAINT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Technician Filter dropdown */}
        <div>
          <select
            value={technicianFilter}
            onChange={(e) => onTechnicianChange(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white truncate"
          >
            <option value="all">All Technicians</option>
            <option value="unassigned">⚠️ Unassigned Queue</option>
            {technicians.map((t) => (
              <option key={t.uid} value={t.uid}>
                {t.displayName || t.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Footer bar with Sorting and Reset */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-2">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-600">Sort by Date:</span>
          <button
            type="button"
            onClick={() => onSortOrderChange(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="font-semibold text-sky-600 hover:text-sky-700 underline"
          >
            {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </button>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center text-sky-600 hover:text-sky-700 font-semibold"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset all filters
          </button>
        )}
      </div>
    </div>
  );
};

export default AdminFilterBar;
