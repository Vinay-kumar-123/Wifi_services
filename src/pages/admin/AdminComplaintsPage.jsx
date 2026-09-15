import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ClipboardList,
  Loader2,
  AlertCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { getAdminComplaints } from '@/services/complaints/complaintService';
import { getActiveTechniciansWithWorkload } from '@/services/users/userService';
import { getFirestoreErrorMessage } from '@/utils/firebaseErrors';
import AdminFilterBar from '@/components/complaints/AdminFilterBar';
import AdminComplaintTable from '@/components/complaints/AdminComplaintTable';
import AssignTechnicianModal from '@/components/complaints/AssignTechnicianModal';

export const AdminComplaintsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [complaints, setComplaints] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [technicianFilter, setTechnicianFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);

  // Manual Assignment Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Fetch Technicians for filter dropdown
  useEffect(() => {
    const fetchTechs = async () => {
      try {
        const techs = await getActiveTechniciansWithWorkload();
        setTechnicians(techs);
      } catch (err) {
        console.warn('Error fetching technicians for filter:', err);
      }
    };
    fetchTechs();
  }, []);

  const fetchComplaints = useCallback(
    async (isInitial = true) => {
      try {
        if (isInitial) {
          setLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const res = await getAdminComplaints({
          status: statusFilter,
          priority: priorityFilter,
          category: categoryFilter,
          technicianId: technicianFilter,
          sortOrder,
          pageSize: 15,
          lastVisibleDoc: isInitial ? null : lastDoc,
        });

        if (isInitial) {
          setComplaints(res.complaints);
        } else {
          setComplaints((prev) => [...prev, ...res.complaints]);
        }

        setLastDoc(res.lastDoc);
        setHasMore(res.hasMore);
      } catch (err) {
        console.error('[AdminComplaintsPage] Error fetching admin complaints:', err);
        setError(getFirestoreErrorMessage(err, 'load admin complaints'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [statusFilter, priorityFilter, categoryFilter, technicianFilter, sortOrder, lastDoc]
  );

  useEffect(() => {
    fetchComplaints(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, priorityFilter, categoryFilter, technicianFilter, sortOrder]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setTechnicianFilter('all');
    setSortOrder('desc');
    setSearchParams({});
  };

  const handleOpenAssignModal = (complaint) => {
    setSelectedComplaint(complaint);
    setAssignModalOpen(true);
  };

  // Client-side text search over the queried set
  // Matches: Customer Name, Phone, Complaint ID, Address, or Category
  const filteredComplaints = complaints.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const idMatch = item.id?.toLowerCase().includes(term);
    const nameMatch = item.customerName?.toLowerCase().includes(term);
    const phoneMatch = item.phone?.toLowerCase().includes(term);
    const addressMatch = item.address?.toLowerCase().includes(term);
    const catMatch = item.category?.toLowerCase().includes(term);
    return idMatch || nameMatch || phoneMatch || addressMatch || catMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Master Complaint Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Search, filter, and manually dispatch broadband service tickets to field technicians.
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchComplaints(true)}
          className="inline-flex items-center px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
          Refresh Queue
        </button>
      </div>

      {/* Advanced Filter Bar */}
      <AdminFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setSearchParams(val !== 'all' ? { status: val } : {});
        }}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        technicianFilter={technicianFilter}
        onTechnicianChange={setTechnicianFilter}
        technicians={technicians}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        onResetFilters={handleResetFilters}
      />

      {/* Content Table / Cards */}
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
            onClick={() => fetchComplaints(true)}
            className="text-xs font-semibold underline hover:no-underline"
          >
            Retry Query
          </button>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <ClipboardList className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Complaints Matched</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            No tickets match your specified search term or filter criteria. Try resetting filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <AdminComplaintTable
            complaints={filteredComplaints}
            onOpenAssignModal={handleOpenAssignModal}
          />

          {/* Pagination */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={() => fetchComplaints(false)}
                disabled={loadingMore}
                className="inline-flex items-center px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin text-sky-600" />
                    Loading More Records...
                  </>
                ) : (
                  'Load More Complaints'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Assignment Modal */}
      {selectedComplaint && (
        <AssignTechnicianModal
          isOpen={assignModalOpen}
          onClose={() => {
            setAssignModalOpen(false);
            setSelectedComplaint(null);
          }}
          complaint={selectedComplaint}
          onSuccess={() => fetchComplaints(true)}
        />
      )}
    </div>
  );
};

export default AdminComplaintsPage;
