import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, LockKeyhole } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/features/auth/schemas';
import { authService } from '@/services/auth.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/shared/error-alert';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [apiError, setApiError] = useState<unknown>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const initialEmail = searchParams.get('email') || '';
  const initialToken = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      token: initialToken,
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (initialEmail) setValue('email', initialEmail);
    if (initialToken) setValue('token', initialToken);
  }, [initialEmail, initialToken, setValue]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    setApiError(null);
    try {
      await authService.resetPassword({
        email: data.email,
        token: data.token,
        newPassword: data.newPassword,
      });
      setIsSuccess(true);
    } catch (err) {
      setApiError(err);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-center py-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-charcoal-900">Password Reset Complete</h2>
        <p className="mt-2 text-sm text-charcoal-600">
          Your password has been successfully updated. All active sessions have been revoked for your security. Please log in with your new password.
        </p>
        <div className="mt-6">
          <Link to="/login">
            <Button variant="primary" className="w-full">
              Proceed to Sign In
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 mb-3">
          <LockKeyhole className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-charcoal-900">Reset your password</h2>
        <p className="mt-1 text-xs text-charcoal-500">
          Enter your reset token and select a new secure password
        </p>
      </div>

      <ErrorAlert error={apiError} className="mb-5" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Email address"
          type="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Reset Token"
          placeholder="Paste reset token here"
          required
          error={errors.token?.message}
          {...register('token')}
        />

        <Input
          label="New Password"
          type="password"
          autoComplete="new-password"
          placeholder="Min 8 characters"
          required
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />

        <Input
          label="Confirm New Password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={isSubmitting}>
          Reset Password
        </Button>
      </form>

      <div className="mt-6 pt-6 border-t border-charcoal-100 text-center text-xs text-charcoal-500">
        Back to{' '}
        <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-800 transition-colors">
          Sign In
        </Link>
      </div>
    </div>
  );
};
