import React, { useState } from 'react';
import { FileText, X, AlertCircle, Loader2 } from 'lucide-react';

export const WorkNoteModal = ({
  isOpen,
  onClose,
  complaint,
  onConfirm,
  isLoading = false,
}) => {
  const [workNote, setWorkNote] = useState('');
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!workNote.trim()) {
      setError('Work note content cannot be empty.');
      return;
    }
    setError(null);
    onConfirm(workNote.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={!isLoading ? onClose : undefined}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 transform transition-all z-10 space-y-4">
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Field Work Log</h3>
              <p className="text-xs text-slate-500">
                Ticket #{complaint?.id.slice(0, 8)}
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

        <p className="text-xs text-slate-600">
          Record ongoing troubleshooting notes, diagnostic readings, or customer contact notes. This will be recorded in the complaint audit history.
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
              Work Note
            </label>
            <textarea
              rows={3}
              value={workNote}
              onChange={(e) => {
                setWorkNote(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Arrived on-site at customer premises; optical power reading is -28dBm (high loss); tracing fiber patch cord..."
              className="w-full p-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              disabled={isLoading}
              required
            />
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
              disabled={isLoading || !workNote.trim()}
              className="inline-flex items-center px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Work Note'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WorkNoteModal;
