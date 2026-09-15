import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wifi, Mail, Lock, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { loginSchema } from '@/schemas/authSchemas';
import { useAuth } from '@/context/AuthContext';
import { getFirebaseAuthErrorMessage } from '@/utils/firebaseErrors';
import { ROLES } from '@/constants/roles';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = location.state?.from?.pathname || null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setAuthError(null);
      setIsSubmitting(true);
      const { profile } = await login(data);

      // Route according to user role or previous location
      if (from && !from.includes('unauthorized') && !from.includes('login')) {
        navigate(from, { replace: true });
        return;
      }

      if (profile.role === ROLES.ADMIN) {
        navigate('/admin/dashboard', { replace: true });
      } else if (profile.role === ROLES.TECHNICIAN) {
        navigate('/technician/dashboard', { replace: true });
      } else {
        navigate('/customer/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
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
            <p className="text-xs font-medium text-sky-400 uppercase tracking-wider">Broadband Support Operations</p>
          </div>
        </div>

        <h2 className="mt-8 text-center text-xl font-semibold text-slate-200">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="font-medium text-sky-400 hover:text-sky-300 transition-colors">
            Register as a Customer
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-medium text-rose-800">{authError}</p>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
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
                  className={`block w-full pl-11 pr-4 py-2.5 sm:text-sm rounded-lg border ${
                    errors.email ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 focus:ring-sky-500 focus:border-sky-500'
                  } transition-colors placeholder:text-slate-400`}
                  placeholder="name@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-sky-600 hover:text-sky-500"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="mt-1.5 relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`block w-full pl-11 pr-4 py-2.5 sm:text-sm rounded-lg border ${
                    errors.password ? 'border-rose-300 focus:ring-rose-500 focus:border-rose-500' : 'border-slate-300 focus:ring-sky-500 focus:border-sky-500'
                  } transition-colors placeholder:text-slate-400`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Authorized access only. All actions are logged and audited in accordance with operational security policies.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
