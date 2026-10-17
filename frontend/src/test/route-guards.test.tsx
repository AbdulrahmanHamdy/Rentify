
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/layout/route-guards';
import { AuthProvider } from '@/features/auth/use-auth';
import { tokenManager } from '@/lib/token-manager';

const renderWithAuth = (initialEntries: string[]) => {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div>Dashboard Content</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-only"
            element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <div>Admin Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
};

describe('Route Guards', () => {
  beforeEach(() => {
    tokenManager.clearAuth(false);
  });

  it('redirects unauthenticated users to /login', () => {
    renderWithAuth(['/dashboard']);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
  });

  it('allows authenticated users to view protected routes', () => {
    tokenManager.setAuth('valid-token', 'refresh-token', {
      userId: '1',
      email: 'user@example.com',
      roles: ['Tenant'],
    });

    renderWithAuth(['/dashboard']);
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('redirects authenticated users without the required role to /unauthorized', () => {
    tokenManager.setAuth('valid-token', 'refresh-token', {
      userId: '1',
      email: 'tenant@example.com',
      roles: ['Tenant'],
    });

    renderWithAuth(['/admin-only']);
    expect(screen.getByText('Unauthorized Page')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('allows users with the matching role into role-guarded routes', () => {
    tokenManager.setAuth('valid-token', 'refresh-token', {
      userId: 'admin-id',
      email: 'admin@example.com',
      roles: ['Admin'],
    });

    renderWithAuth(['/admin-only']);
    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });
});
