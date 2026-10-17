import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, MailCheck } from 'lucide-react';
import { confirmEmailSchema, type ConfirmEmailFormData } from '@/features/auth/schemas';
import { authService } from '@/services/auth.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/shared/error-alert';

export const ConfirmEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [apiError, setApiError] = useState<unknown>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const initialUserId = searchParams.get('userId') || '';
  const initialToken = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmEmailFormData>({
    resolver: zodResolver(confirmEmailSchema),
    defaultValues: {
      userId: initialUserId,
      token: initialToken,
    },
  });

  useEffect(() => {
    if (initialUserId) setValue('userId', initialUserId);
    if (initialToken) setValue('token', initialToken);
  }, [initialUserId, initialToken, setValue]);

  const onSubmit = async (data: ConfirmEmailFormData) => {
    setApiError(null);
    try {
      await authService.confirmEmail(data);
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
        <h2 className="text-xl font-bold text-charcoal-900">Email Verified!</h2>
        <p className="mt-2 text-sm text-charcoal-600">
          Your account has been successfully verified. You can now log in and manage your rental operations.
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
          <MailCheck className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-charcoal-900">Confirm your email</h2>
        <p className="mt-1 text-xs text-charcoal-500">
          Enter the user ID and verification token provided in your confirmation link
        </p>
      </div>

      <ErrorAlert error={apiError} className="mb-5" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="User ID"
          placeholder="e.g. 0b81..."
          required
          error={errors.userId?.message}
          {...register('userId')}
        />

        <Input
          label="Confirmation Token"
          placeholder="Paste confirmation token here"
          required
          error={errors.token?.message}
          {...register('token')}
        />

        <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={isSubmitting}>
          Verify Email
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
