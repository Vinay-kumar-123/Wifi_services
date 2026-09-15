import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wifi, Mail, Lock, User, Phone, AlertCircle, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { registerSchema } from '@/schemas/authSchemas';
import { useAuth } from '@/context/AuthContext';
import { getFirebaseAuthErrorMessage } from '@/utils/firebaseErrors';

export const RegisterPage = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setAuthError(null);
      setIsSubmitting(true);

      // Register customer account (Role is strictly locked to 'customer' in the service)
      await registerAuth({
        displayName: data.displayName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });

      navigate('/customer/dashboard', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      setAuthError(getFirebaseAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-slate-800 to-sky-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-sky-500/30 text-white">
            <Wifi className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">WiFi Service Desk</h1>
            <p className="text-xs font-medium text-sky-400 uppercase tracking-wider">Broadband Customer Portal</p>
          </div>
        </div>

        <h2 className="mt-8 text-center text-xl font-semibold text-slate-200">
          Create a Customer Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="font-medium text-sky-400 hover:text-sky-300 transition-colors">
            Sign in to existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          <div className="mb-6 p-3 rounded-lg bg-sky-50 border border-sky-200 flex items-center space-x-2.5 text-xs text-sky-800 font-medium">
            <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <span>Secure account creation. Default role is registered as <strong>Customer</strong>.</span>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-rose-800">{authError}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  autoComplete="name"
                  {...register('displayName')}
                  className={`block w-full pl-11 pr-4 py-2 sm:text-sm rounded-lg border ${
                    errors.displayName ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 focus:ring-sky-500 focus:border-sky-500'
                  } transition-colors placeholder:text-slate-400`}
                  placeholder="e.g. John Doe"
                />
              </div>
              {errors.displayName && (
                <p className="mt-1 text-xs text-rose-600">{errors.displayName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`block w-full pl-11 pr-4 py-2 sm:text-sm rounded-lg border ${
                    errors.email ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 focus:ring-sky-500 focus:border-sky-500'
                  } transition-colors placeholder:text-slate-400`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Phone Number</label>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="h-5 w-5" />
                </div>
                <input
                  type="tel"
                  autoComplete="tel"
                  {...register('phone')}
                  className={`block w-full pl-11 pr-4 py-2 sm:text-sm rounded-lg border ${
                    errors.phone ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 focus:ring-sky-500 focus:border-sky-500'
                  } transition-colors placeholder:text-slate-400`}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-xs text-rose-600">{errors.phone.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="mt-1.5 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    autoComplete="new-password"
                    {...register('password')}
                    className={`block w-full pl-11 pr-4 py-2 sm:text-sm rounded-lg border ${
                      errors.password ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 focus:ring-sky-500 focus:border-sky-500'
                    } transition-colors placeholder:text-slate-400`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
                <div className="mt-1.5 relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    type="password"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    className={`block w-full pl-11 pr-4 py-2 sm:text-sm rounded-lg border ${
                      errors.confirmPassword ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 focus:ring-sky-500 focus:border-sky-500'
                    } transition-colors placeholder:text-slate-400`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
