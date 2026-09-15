import React, { useState } from 'react';
import { CheckCircle2, X, AlertCircle, Loader2 } from 'lucide-react';

export const ResolveComplaintModal = ({
  isOpen,
  onClose,
  complaint,
  onConfirm,
  isLoading = false,
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim() || resolutionNotes.trim().length < 10) {
      setError('Resolution notes are mandatory and must be at least 10 characters.');
      return;
    }
    setError(null);
    onConfirm(resolutionNotes.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 transform transition-all z-10 space-y-4">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Mark Complaint as Resolved</h3>
              <p className="text-xs text-slate-500">
                Ticket #{complaint?.id.slice(0, 8)} · {complaint?.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-600">
          Please record complete technical resolution details. Explain what caused the incident, router reconfiguration done, cable spliced, or tests verified with the customer.
        </p>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Mandatory Resolution Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              value={resolutionNotes}
              onChange={(e) => {
                setResolutionNotes(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Inspected optical fiber at subscriber premises; replaced faulty RJ45 connector; restarted ONU and verified 150Mbps download / 150Mbps upload speeds with customer."
              className="w-full p-3 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              disabled={isLoading}
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              {resolutionNotes.trim().length} / 10 characters minimum
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || resolutionNotes.trim().length < 10}
              className="inline-flex items-center px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Submitting Resolution...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                  Submit Resolution
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResolveComplaintModal;
