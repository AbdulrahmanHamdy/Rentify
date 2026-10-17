import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/features/auth/schemas';
import { useAuth } from '@/features/auth/use-auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/shared/error-alert';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<unknown>(null);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const registeredState = location.state as { registered?: boolean; email?: string } | null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: registeredState?.email || '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      await login(data);
      navigate(from, { replace: true });
    } catch (err) {
      setApiError(err);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold tracking-tight text-charcoal-900">Sign in to your account</h2>
        <p className="mt-1 text-xs text-charcoal-500">
          Enter your credentials to access properties, contracts, and payments
        </p>
      </div>

      {registeredState?.registered && (
        <div className="mb-5 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 flex items-center gap-2">
          <span className="font-semibold">Account created!</span> Please enter your password to sign in.
        </div>
      )}

      <ErrorAlert error={apiError} className="mb-5" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            error={errors.password?.message}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-charcoal-400 hover:text-charcoal-600 focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center justify-end">
          <Link
            to="/forgot-password"
            className="text-xs font-medium text-brand-600 hover:text-brand-800 transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={isSubmitting}>
          <LogIn className="w-4 h-4" />
          <span>Sign In</span>
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-charcoal-100 text-center text-xs text-charcoal-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-800 transition-colors">
          Register now
        </Link>
      </div>
    </div>
  );
};
