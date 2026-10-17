import React from 'react';
import { AlertCircle } from 'lucide-react';
import { parseApiError } from '@/lib/utils';

export interface ErrorAlertProps {
  error: unknown;
  className?: string;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ error, className }) => {
  if (!error) return null;

  const { message, errors } = parseApiError(error);

  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 ${className || ''}`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          <p className="font-medium text-red-900">{message}</p>
          {errors && errors.length > 0 && (
            <ul className="list-disc pl-5 space-y-0.5 text-xs text-red-700">
              {errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
