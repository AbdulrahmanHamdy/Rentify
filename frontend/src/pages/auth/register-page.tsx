import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, CheckCircle2, ArrowRight } from 'lucide-react';
import { registerSchema, type RegisterFormData } from '@/features/auth/schemas';
import { useAuth } from '@/features/auth/use-auth';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/shared/error-alert';
import type { RegisterResponse } from '@/types';

export const RegisterPage: React.FC = () => {
  const { register: registerUser, login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<unknown>(null);
  const [successResponse, setSuccessResponse] = useState<RegisterResponse | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      role: 'Tenant',
      firstName: '',
      lastName: '',
      phoneNumber: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    try {
      const res = await registerUser({
        email: data.email,
        password: data.password,
        role: data.role,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        phoneNumber: data.phoneNumber || undefined,
      });

      // Try seamless auto-login right after registration
      try {
        await login({ email: data.email, password: data.password });
        navigate('/dashboard', { replace: true });
        return;
      } catch {
        // If auto-login fails, show friendly success state to sign in manually
        setSuccessResponse(res);
      }
    } catch (err) {
      setApiError(err);
    }
  };

  if (successResponse) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-sm">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-charcoal-900">Account Created Successfully!</h2>
        <p className="mt-2 text-sm text-charcoal-600">
          Welcome to Rentify, <span className="font-semibold text-charcoal-800">{successResponse.email}</span>. Your account is active and ready to use immediately.
        </p>
        <div className="mt-6">
          <Link to="/login">
            <Button variant="primary" className="w-full flex items-center justify-center gap-2">
              <span>Proceed to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold tracking-tight text-charcoal-900">Create your account</h2>
        <p className="mt-1 text-xs text-charcoal-500">
          Join Rentify as a Property Owner or Tenant
        </p>
      </div>

      <ErrorAlert error={apiError} className="mb-5" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Select
          label="Account Type"
          required
          error={errors.role?.message}
          options={[
            { value: 'Tenant', label: 'Tenant — I want to find and rent units' },
            { value: 'Owner', label: 'Property Owner — I manage properties and units' },
          ]}
          {...register('role')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="First Name"
            placeholder="John"
            error={errors.firstName?.message}
            {...register('firstName')}
          />
          <Input
            label="Last Name"
            placeholder="Doe"
            error={errors.lastName?.message}
            {...register('lastName')}
          />
        </div>

        <Input
          label="Phone Number"
          type="tel"
          placeholder="+20 100 123 4567"
          error={errors.phoneNumber?.message}
          {...register('phoneNumber')}
        />

        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="Min 8 characters"
          required
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Confirm Password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={isSubmitting}>
          <UserPlus className="w-4 h-4" />
          <span>Create Account</span>
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-charcoal-100 text-center text-xs text-charcoal-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-800 transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
};
