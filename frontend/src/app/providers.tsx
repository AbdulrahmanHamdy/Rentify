import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/features/auth/use-auth';
import { SplashScreen } from '@/components/shared/splash-screen';
import { ToastProvider } from '@/components/ui/toast';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <SplashScreen />
          {children}
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
