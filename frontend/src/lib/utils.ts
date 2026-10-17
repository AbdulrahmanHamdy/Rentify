import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Currency formatter (defaults to EGP, Egyptian Pound)
 */
export function formatCurrency(
  amount: number | null | undefined,
  locale = 'en-EG',
  currency = 'EGP'
): string {
  if (amount == null || isNaN(amount)) return '—';
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Date formatter (e.g. Oct 14, 2026)
 */
export function formatDate(dateString: string | null | undefined, locale = 'en-EG'): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Date + Time formatter
 */
export function formatDateTime(dateString: string | null | undefined, locale = 'en-EG'): string {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Extract clean, user-friendly error message from backend ApiErrorResponse
 */
export function parseApiError(error: unknown): { message: string; errors?: string[] } {
  if (!error || typeof error !== 'object') {
    return { message: 'An unexpected error occurred. Please try again.' };
  }

  const err = error as Record<string, unknown>;
  const response = err.response as Record<string, unknown> | undefined;

  if (response && response.data && typeof response.data === 'object') {
    const data = response.data as { message?: string; errors?: string[]; statusCode?: number };
    return {
      message: data.message || 'The request could not be processed.',
      errors: Array.isArray(data.errors) ? data.errors : undefined,
    };
  }

  if (typeof err.message === 'string') {
    if (err.message.includes('Network Error')) {
      return { message: 'Unable to reach the server. Please check your internet connection or verify the API is running.' };
    }
    return { message: err.message };
  }

  return { message: 'An unexpected error occurred. Please try again.' };
}
