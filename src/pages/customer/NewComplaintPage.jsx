import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Wifi,
  ArrowLeft,
  MapPin,
  Phone,
  User,
  FileText,
  AlertTriangle,
  Upload,
  X,
  Loader2,
  Paperclip,
  CheckCircle2,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { complaintSchema } from '@/schemas/complaintSchemas';
import { createComplaint } from '@/services/complaints/complaintService';
import { useAuth } from '@/context/AuthContext';
import {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  PRIORITY_LABELS,
} from '@/constants/complaintStatus';

export const NewComplaintPage = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      customerName: userProfile?.displayName || '',
      phone: userProfile?.phone || '',
      address: '',
      category: COMPLAINT_CATEGORIES[0],
      priority: COMPLAINT_PRIORITIES.MEDIUM,
      description: '',
      preferredContactMethod: 'phone',
    },
  });

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFileError(null);

    // Validate size (< 10MB) and type
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        setFileError(`File "${file.name}" exceeds the maximum 10MB limit.`);
        return;
      }
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      if (!isImage && !isPdf) {
        setFileError(`File "${file.name}" must be an image (JPEG, PNG, WEBP) or PDF document.`);
        return;
      }
    }

    if (selectedFiles.length + files.length > 5) {
      setFileError('You can attach a maximum of 5 files.');
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      const newTicket = await createComplaint(currentUser, data, selectedFiles);
      toast.success('Complaint registered successfully! Awaiting administrator technician dispatch.');
      navigate(`/customer/complaints/${newTicket.id}`, { replace: true });
    } catch (err) {
      console.error('Error submitting complaint:', err);
      toast.error(err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button and page title */}
      <div className="flex items-center space-x-3">
        <Link
          to="/customer/dashboard"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white transition-colors border border-transparent hover:border-slate-200"
          title="Back to Dashboard"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Submit a Service Complaint</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Log a Wi-Fi or broadband incident directly with our Network Operations Center.
          </p>
        </div>
      </div>

      {/* Info notice about dispatch policy */}
      <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 flex items-start space-x-3 text-sky-800 text-xs sm:text-sm">
        <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-sky-900">Standard Support Policy:</span> Once submitted, your complaint is assigned an initial status of <strong>Open</strong>. An operations admin will manually review your issue and dispatch a certified technician to your location.
        </div>
      </div>

      {/* Complaint Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          {/* Section: Customer & Contact Information */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 mb-4">
              Contact & Location Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Customer Name</label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('customerName')}
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                      errors.customerName ? 'border-rose-300' : 'border-slate-300'
                    } focus:ring-sky-500 focus:border-sky-500`}
                    placeholder="Full name"
                  />
                </div>
                {errors.customerName && (
                  <p className="mt-1 text-xs text-rose-600">{errors.customerName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Contact Phone</label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    {...register('phone')}
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                      errors.phone ? 'border-rose-300' : 'border-slate-300'
                    } focus:ring-sky-500 focus:border-sky-500`}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700">Installation Address / Service Location</label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    {...register('address')}
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border ${
                      errors.address ? 'border-rose-300' : 'border-slate-300'
                    } focus:ring-sky-500 focus:border-sky-500`}
                    placeholder="House/Apartment #, Street name, City, Postal code"
                  />
                </div>
                {errors.address && (
                  <p className="mt-1 text-xs text-rose-600">{errors.address.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Complaint Details */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 mb-4">
              Incident Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700">Complaint Category</label>
                <select
                  {...register('category')}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:ring-sky-500 focus:border-sky-500"
                >
                  {COMPLAINT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-xs text-rose-600">{errors.category.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Priority Level</label>
                <select
                  {...register('priority')}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:ring-sky-500 focus:border-sky-500"
                >
                  {Object.values(COMPLAINT_PRIORITIES).map((priority) => (
                    <option key={priority} value={priority}>
                      {PRIORITY_LABELS[priority] || priority}
                    </option>
                  ))}
                </select>
                {errors.priority && (
                  <p className="mt-1 text-xs text-rose-600">{errors.priority.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Preferred Contact Method</label>
                <select
                  {...register('preferredContactMethod')}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="phone">Phone Call</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
                {errors.preferredContactMethod && (
                  <p className="mt-1 text-xs text-rose-600">{errors.preferredContactMethod.message}</p>
                )}
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700">Issue Description</label>
                <textarea
                  rows={4}
                  {...register('description')}
                  className={`mt-1 w-full p-3 text-sm rounded-lg border ${
                    errors.description ? 'border-rose-300' : 'border-slate-300'
                  } focus:ring-sky-500 focus:border-sky-500`}
                  placeholder="Describe router symptoms, error messages, frequency of disconnects, device lights, or recent changes..."
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-rose-600">{errors.description.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Optional Attachments */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-2 mb-3">
              Optional Attachments
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Upload photos of router LED status, speed test screenshots, or error logs (Images or PDF, max 10MB each, up to 5 files).
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="cursor-pointer inline-flex items-center px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200">
                <Upload className="w-4 h-4 mr-2 text-slate-600" />
                Select Attachments
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-slate-400">
                {selectedFiles.length === 0 ? 'No files selected' : `${selectedFiles.length} file(s) chosen`}
              </span>
            </div>

            {fileError && (
              <p className="mt-2 text-xs text-rose-600 font-medium">{fileError}</p>
            )}

            {selectedFiles.length > 0 && (
              <ul className="mt-3 divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                {selectedFiles.map((file, idx) => (
                  <li key={idx} className="p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <Paperclip className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="font-medium text-slate-700 truncate">{file.name}</span>
                      <span className="text-slate-400 text-[10px]">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <Link
              to="/customer/dashboard"
              className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm shadow-md shadow-sky-600/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting Ticket...
                </>
              ) : (
                'Submit Complaint'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewComplaintPage;
