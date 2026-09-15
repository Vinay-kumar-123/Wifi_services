import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getCustomerComplaints } from '@/services/complaints/complaintService';
import { getFirestoreErrorMessage } from '@/utils/firebaseErrors';
import ComplaintFilterBar from '@/components/complaints/ComplaintFilterBar';
import ComplaintCard from '@/components/complaints/ComplaintCard';

export const CustomerComplaintsPage = () => {
  const { currentUser } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Pagination States
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchComplaints = useCallback(
    async (isInitial = true, cursorDoc = null) => {
      if (!currentUser?.uid) return;

      if (import.meta.env.DEV) {
        console.debug('[CustomerComplaintsPage] fetchComplaints', {
          uid: currentUser.uid,
          isInitial,
          hasCursor: Boolean(cursorDoc),
          statusFilter,
          priorityFilter,
          categoryFilter,
        });
      }

      try {
        if (isInitial) {
          setLoading(true);
          setError(null);
        } else {
          setLoadingMore(true);
        }

        const res = await getCustomerComplaints(currentUser.uid, {
          status: statusFilter,
          priority: priorityFilter,
          category: categoryFilter,
          pageSize: 10,
          // Always null for initial/filter-change loads; caller supplies cursor for pagination
          lastVisibleDoc: isInitial ? null : cursorDoc,
        });

        if (isInitial) {
          setComplaints(res.complaints);
        } else {
          setComplaints((prev) => [...prev, ...res.complaints]);
        }

        setLastDoc(res.lastDoc);
        setHasMore(res.hasMore);
      } catch (err) {
        console.error('[CustomerComplaintsPage] Error fetching complaints:', err);
        setError(getFirestoreErrorMessage(err, 'load customer complaints'));
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    // lastDoc intentionally excluded: it is passed as a parameter, not read from closure.
    // Including it would cause fetchComplaints to be recreated on every page advance,
    // and the filter-change effect would call the stale function with the old cursor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.uid, statusFilter, priorityFilter, categoryFilter]
  );

  // Re-fetch from page 1 whenever filters or the authenticated user changes.
  // We reset lastDoc here so the Load More button always starts from a clean cursor.
  useEffect(() => {
    setLastDoc(null);
    setHasMore(false);
    fetchComplaints(true, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid, statusFilter, priorityFilter, categoryFilter]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
  };

  // Client-side text search over the currently loaded set
  const filteredComplaints = complaints.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const idMatch = item.id?.toLowerCase().includes(term);
    const categoryMatch = item.category?.toLowerCase().includes(term);
    const descMatch = item.description?.toLowerCase().includes(term);
    return idMatch || categoryMatch || descMatch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My Complaint History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            View real-time status, technician assignments, and resolution notes for your tickets.
          </p>
        </div>

        <Link
          to="/customer/new-complaint"
          className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-sm transition-colors whitespace-nowrap"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Submit New Complaint
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <ComplaintFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        onResetFilters={handleResetFilters}
      />

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-3"
            >
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/6"></div>
              </div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Unable to load complaints</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">{error}</p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fetchComplaints(true)}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all"
            >
              Retry Loading
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
            >
              Reset Filters
            </button>
          </div>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No complaints found</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1">
              {complaints.length === 0
                ? "You haven't submitted any service tickets yet. Our technical operations team is ready to assist you."
                : 'No tickets match your active filter criteria. Try adjusting your search query or filters.'}
            </p>
          </div>
          {complaints.length === 0 && (
            <Link
              to="/customer/new-complaint"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Create Complaint
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {filteredComplaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>

          {/* Pagination Load More */}
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
                    Loading More Tickets...
                  </>
                ) : (
                  'Load More Tickets'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerComplaintsPage;
