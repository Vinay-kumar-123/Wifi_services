import React, { useState } from 'react';
import { X, UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const initialForm = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  employeeId: '',
  serviceArea: '',
  specialization: '',
  photoURL: '',
  isActive: true,
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AddTechnicianModal = ({ isOpen, onClose, onSubmit, isLoading = false }) => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitMessage, setSubmitMessage] = useState(null);

  if (!isOpen) return null;

  const validate = () => {
    const nextErrors = {};
    const trimmedName = form.fullName.trim();
    const trimmedEmail = form.email.trim().toLowerCase();
    const digitsOnly = form.phone.replace(/\D/g, '');

    if (!trimmedName || trimmedName.length < 2) {
      nextErrors.fullName = 'Full name is required.';
    }

    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    if (!digitsOnly || digitsOnly.length < 8) {
      nextErrors.phone = 'Please enter a valid phone number.';
    }

    return nextErrors;
  };

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSubmitMessage({ type: 'error', text: 'Please fix the highlighted fields and try again.' });
      return;
    }

    setSubmitMessage(null);
    try {
      await onSubmit({
        ...form,
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        employeeId: form.employeeId.trim(),
        serviceArea: form.serviceArea.trim(),
        specialization: form.specialization.trim(),
        photoURL: form.photoURL.trim() || null,
      });
      setForm(initialForm);
      setErrors({});
      setSubmitMessage({ type: 'success', text: 'Technician account created successfully.' });
    } catch (err) {
      setSubmitMessage({ type: 'error', text: err.message || 'Unable to create technician account.' });
    }
  };

  const handleClose = () => {
    setForm(initialForm);
    setErrors({});
    setSubmitMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={isLoading ? undefined : handleClose}
      />

      <div className="relative z-10 w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Technician</h3>
              <p className="text-xs text-slate-500">Create a new field technician account</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Full name
              </label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="Jane Smith"
              />
              {errors.fullName && <p className="mt-1 text-xs text-rose-600">{errors.fullName}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Email address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="jane.smith@wifiops.com"
              />
              {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Phone number
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="+1 (555) 123-4567"
              />
              {errors.phone && <p className="mt-1 text-xs text-rose-600">{errors.phone}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Employee ID
              </label>
              <input
                type="text"
                name="employeeId"
                value={form.employeeId}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="TECH-1042"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Service area
              </label>
              <input
                type="text"
                name="serviceArea"
                value={form.serviceArea}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="North Metro"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                Specialization
              </label>
              <input
                type="text"
                name="specialization"
                value={form.specialization}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                placeholder="Broadband diagnostics"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Address (optional)
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              placeholder="Service base or mailing address"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Profile photo URL (optional)
            </label>
            <input
              type="url"
              name="photoURL"
              value={form.photoURL}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              placeholder="https://example.com/tech-photo.jpg"
            />
          </div>

          <p className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-800">
            The technician will receive an account setup email and choose their own password. No password is stored by this form.
          </p>

          {submitMessage && (
            <div
              className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${
                submitMessage.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-rose-200 bg-rose-50 text-rose-700'
              }`}
            >
              {submitMessage.type === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <span>{submitMessage.text}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center rounded-xl bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-amber-600/20 transition-colors hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Creating Technician...
                </>
              ) : (
                'Create Technician'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTechnicianModal;
