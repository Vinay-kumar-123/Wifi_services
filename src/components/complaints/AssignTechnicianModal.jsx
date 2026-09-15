import React, { useState, useEffect } from 'react';
import {
  Wrench,
  X,
  User,
  Phone,
  Mail,
  Check,
  AlertCircle,
  Loader2,
  TrendingDown,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getActiveTechniciansWithWorkload } from '@/services/users/userService';
import { assignTechnicianToComplaint } from '@/services/complaints/complaintService';
import { useAuth } from '@/context/AuthContext';

export const AssignTechnicianModal = ({
  isOpen,
  onClose,
  complaint,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [technicians, setTechnicians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTechId, setSelectedTechId] = useState('');
  const [assignmentNote, setAssignmentNote] = useState('');
  const [error, setError] = useState(null);

  const isReassignment = Boolean(complaint?.assignedTechnicianId);

  useEffect(() => {
    if (!isOpen) return;

    const fetchTechnicians = async () => {
      try {
        setLoading(true);
        setError(null);
        const techs = await getActiveTechniciansWithWorkload();
        setTechnicians(techs);

        // Pre-select current technician if reassignment
        if (complaint?.assignedTechnicianId) {
          setSelectedTechId(complaint.assignedTechnicianId);
        } else if (techs.length > 0) {
          // Pre-select recommended technician (lowest workload)
          setSelectedTechId(techs[0].uid);
        }
      } catch (err) {
        console.error('Error fetching technicians for assignment:', err);
        setError('Failed to fetch active technicians. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchTechnicians();
  }, [isOpen, complaint?.assignedTechnicianId]);

  const handleAssign = async () => {
    if (!selectedTechId) {
      toast.error('Please select a technician.');
      return;
    }

    const selectedTech = technicians.find((t) => t.uid === selectedTechId);
    if (!selectedTech) {
      toast.error('Selected technician not found.');
      return;
    }

    try {
      setSubmitting(true);
      await assignTechnicianToComplaint(complaint.id, selectedTech, currentUser, {
        note: assignmentNote,
        isReassignment,
      });

      toast.success(
        isReassignment
          ? `Complaint reassigned to ${selectedTech.displayName || 'technician'}.`
          : `Technician ${selectedTech.displayName || ''} successfully assigned!`
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error assigning technician:', err);
      toast.error(err.message || 'Failed to assign technician.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={!submitting ? onClose : undefined}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 transform transition-all z-10 space-y-5">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isReassignment ? 'Reassign Technician' : 'Manual Technician Assignment'}
              </h3>
              <p className="text-xs text-slate-500">
                Ticket #{complaint?.id.slice(0, 8)} · {complaint?.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status info */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Customer:</span>
            <span className="font-semibold text-slate-800">{complaint?.customerName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Location:</span>
            <span className="font-medium text-slate-800 truncate max-w-xs">{complaint?.address}</span>
          </div>
          {isReassignment && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-amber-800">
              <span className="font-medium">Currently Assigned:</span>
              <span className="font-bold">{complaint?.assignedTechnicianName}</span>
            </div>
          )}
        </div>

        {/* Technician Selection List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Select Certified Technician
            </label>
            <span className="text-[11px] text-slate-400">
              Sorted by lowest active workload
            </span>
          </div>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
              <p className="text-xs font-medium">Calculating technician capacity...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : technicians.length === 0 ? (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs text-center space-y-2">
              <Info className="w-6 h-6 mx-auto text-amber-600" />
              <p className="font-semibold">No active field technicians found.</p>
              <p className="text-amber-700">
                Please promote or register a technician account in User Management first.
              </p>
            </div>
          ) : (
            <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
              {technicians.map((tech, index) => {
                const isSelected = selectedTechId === tech.uid;
                const isLowest = index === 0;

                return (
                  <label
                    key={tech.uid}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/50 ring-1 ring-sky-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="technicianSelect"
                        value={tech.uid}
                        checked={isSelected}
                        onChange={() => setSelectedTechId(tech.uid)}
                        className="text-sky-600 focus:ring-sky-500 h-4 w-4"
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-900">
                            {tech.displayName || 'Technician'}
                          </span>
                          {isLowest && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                              <TrendingDown className="w-2.5 h-2.5 mr-0.5" />
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-0.5">
                          <span>{tech.email}</span>
                          {tech.phone && <span>· {tech.phone}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Workload Badge */}
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tech.activeWorkload === 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : tech.activeWorkload <= 2
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {tech.activeWorkload} active {tech.activeWorkload === 1 ? 'task' : 'tasks'}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Assignment Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
            Dispatch Instructions / Admin Note (Optional)
          </label>
          <textarea
            rows={2}
            value={assignmentNote}
            onChange={(e) => setAssignmentNote(e.target.value)}
            placeholder="e.g. Priority dispatch, customer requests afternoon visit, router swap needed..."
            className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={submitting || !selectedTechId || technicians.length === 0}
            className="inline-flex items-center px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-md shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {submitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Dispatching...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                {isReassignment ? 'Confirm Reassignment' : 'Confirm Assignment'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignTechnicianModal;
