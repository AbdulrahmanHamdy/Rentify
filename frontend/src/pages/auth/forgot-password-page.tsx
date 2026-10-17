import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/features/auth/schemas';
import { authService } from '@/services/auth.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/shared/error-alert';

export const ForgotPasswordPage: React.FC = () => {
  const [apiError, setApiError] = useState<unknown>(null);
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setApiError(null);
    try {
      const res = await authService.forgotPassword(data);
      setSubmittedMessage(res.message);
    } catch (err) {
      setApiError(err);
    }
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600 mb-3">
          <KeyRound className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-charcoal-900">Forgot your password?</h2>
        <p className="mt-1 text-xs text-charcoal-500">
          Enter your registered email address and we will send you a reset link
        </p>
      </div>

      <ErrorAlert error={apiError} className="mb-5" />

      {submittedMessage ? (
        <div className="rounded-xl border border-charcoal-200 bg-charcoal-50 p-4 text-center space-y-3">
          <p className="text-sm font-medium text-charcoal-800">{submittedMessage}</p>
          <p className="text-xs text-charcoal-500">
            For security reasons, we do not reveal whether the email address is registered. If the account exists, you will receive instructions shortly.
          </p>
          <div className="pt-2">
            <Link to="/reset-password">
              <Button variant="outline" size="sm" className="w-full">
                Have a reset token? Enter it here
              </Button>
            </Link>
          </div>
        </div>
      ) : (
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

          <Button type="submit" variant="primary" size="md" className="w-full mt-2" isLoading={isSubmitting}>
            Send Reset Instructions
          </Button>
        </form>
      )}

      <div className="mt-6 pt-6 border-t border-charcoal-100 text-center">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-600 hover:text-charcoal-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  );
};
