import { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Loader2 } from 'lucide-react';

// Lazy-loaded page components for route-level code splitting
const LoginPage = lazy(() => import('@/pages/auth/login-page').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth/register-page').then((m) => ({ default: m.RegisterPage })));
const ConfirmEmailPage = lazy(() => import('@/pages/auth/confirm-email-page').then((m) => ({ default: m.ConfirmEmailPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/forgot-password-page').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/pages/auth/reset-password-page').then((m) => ({ default: m.ResetPasswordPage })));
const LandingPage = lazy(() => import('@/pages/landing/landing-page').then((m) => ({ default: m.LandingPage })));

const DashboardPage = lazy(() => import('@/pages/dashboard/dashboard-page').then((m) => ({ default: m.DashboardPage })));
const PropertiesListPage = lazy(() => import('@/pages/properties/properties-list-page').then((m) => ({ default: m.PropertiesListPage })));
const PropertyDetailsPage = lazy(() => import('@/pages/properties/property-details-page').then((m) => ({ default: m.PropertyDetailsPage })));
const PropertyCreatePage = lazy(() => import('@/pages/properties/property-create-page').then((m) => ({ default: m.PropertyCreatePage })));
const PropertyEditPage = lazy(() => import('@/pages/properties/property-edit-page').then((m) => ({ default: m.PropertyEditPage })));

const UnitDetailsPage = lazy(() => import('@/pages/units/unit-details-page').then((m) => ({ default: m.UnitDetailsPage })));
const UnitCreatePage = lazy(() => import('@/pages/units/unit-create-page').then((m) => ({ default: m.UnitCreatePage })));
const UnitEditPage = lazy(() => import('@/pages/units/unit-edit-page').then((m) => ({ default: m.UnitEditPage })));

const ContractsListPage = lazy(() => import('@/pages/contracts/contracts-list-page').then((m) => ({ default: m.ContractsListPage })));
const ContractDetailsPage = lazy(() => import('@/pages/contracts/contract-details-page').then((m) => ({ default: m.ContractDetailsPage })));
const ContractCreatePage = lazy(() => import('@/pages/contracts/contract-create-page').then((m) => ({ default: m.ContractCreatePage })));

const PaymentsListPage = lazy(() => import('@/pages/payments/payments-list-page').then((m) => ({ default: m.PaymentsListPage })));
const MaintenanceListPage = lazy(() => import('@/pages/maintenance/maintenance-list-page').then((m) => ({ default: m.MaintenanceListPage })));
const ProfilePage = lazy(() => import('@/pages/profile/profile-page').then((m) => ({ default: m.ProfilePage })));

const NotFoundPage = lazy(() => import('@/pages/not-found-page').then((m) => ({ default: m.NotFoundPage })));
const UnauthorizedPage = lazy(() => import('@/pages/unauthorized-page').then((m) => ({ default: m.UnauthorizedPage })));

// eslint-disable-next-line react-refresh/only-export-components
const PageLoader = () => (
  <div className="flex h-[60vh] w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
  </div>
);

import { ProtectedRoute, PublicOnlyRoute } from '@/components/layout/route-guards';



export const router = createBrowserRouter([
  // Public Landing Page
  {
    path: '/',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LandingPage />
      </Suspense>
    ),
  },

  // Public Auth Routes
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: (
          <PublicOnlyRoute>
            <Suspense fallback={<PageLoader />}>
              <LoginPage />
            </Suspense>
          </PublicOnlyRoute>
        ),
      },
      {
        path: '/register',
        element: (
          <PublicOnlyRoute>
            <Suspense fallback={<PageLoader />}>
              <RegisterPage />
            </Suspense>
          </PublicOnlyRoute>
        ),
      },
      {
        path: '/confirm-email',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ConfirmEmailPage />
          </Suspense>
        ),
      },
      {
        path: '/forgot-password',
        element: (
          <PublicOnlyRoute>
            <Suspense fallback={<PageLoader />}>
              <ForgotPasswordPage />
            </Suspense>
          </PublicOnlyRoute>
        ),
      },
      {
        path: '/reset-password',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ResetPasswordPage />
          </Suspense>
        ),
      },
    ],
  },

  // Protected Dashboard Routes
  {
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '/dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: '/properties',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PropertiesListPage />
          </Suspense>
        ),
      },
      {
        path: '/properties/create',
        element: (
          <ProtectedRoute allowedRoles={['Owner', 'Admin']}>
            <Suspense fallback={<PageLoader />}>
              <PropertyCreatePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/properties/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PropertyDetailsPage />
          </Suspense>
        ),
      },
      {
        path: '/properties/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={['Owner', 'Admin']}>
            <Suspense fallback={<PageLoader />}>
              <PropertyEditPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/properties/:propertyId/units/create',
        element: (
          <ProtectedRoute allowedRoles={['Owner', 'Admin']}>
            <Suspense fallback={<PageLoader />}>
              <UnitCreatePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/units/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <UnitDetailsPage />
          </Suspense>
        ),
      },
      {
        path: '/units/:id/edit',
        element: (
          <ProtectedRoute allowedRoles={['Owner', 'Admin']}>
            <Suspense fallback={<PageLoader />}>
              <UnitEditPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/contracts',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ContractsListPage />
          </Suspense>
        ),
      },
      {
        path: '/contracts/create',
        element: (
          <ProtectedRoute allowedRoles={['Tenant', 'Admin']}>
            <Suspense fallback={<PageLoader />}>
              <ContractCreatePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: '/contracts/:id',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ContractDetailsPage />
          </Suspense>
        ),
      },
      {
        path: '/payments',
        element: (
          <Suspense fallback={<PageLoader />}>
            <PaymentsListPage />
          </Suspense>
        ),
      },
      {
        path: '/maintenance',
        element: (
          <Suspense fallback={<PageLoader />}>
            <MaintenanceListPage />
          </Suspense>
        ),
      },
      {
        path: '/profile',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        ),
      },
    ],
  },

  // Fallback and Status Routes
  {
    path: '/unauthorized',
    element: (
      <Suspense fallback={<PageLoader />}>
        <UnauthorizedPage />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<PageLoader />}>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);
