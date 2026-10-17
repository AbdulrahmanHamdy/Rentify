import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen flex-col justify-center bg-charcoal-50 py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md">
            <Home className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-charcoal-900">Rentify</span>
        </Link>
        <p className="mt-2 text-xs uppercase tracking-wider text-charcoal-500 font-semibold">
          Property Rental Management Platform
        </p>
      </div>

      {/* Main Form Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="rounded-2xl border border-charcoal-200 bg-white px-6 py-8 shadow-sm sm:px-10">
          <Outlet />
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-xs text-charcoal-500">
          <p>© {new Date().getFullYear()} Rentify. Secure Property Management System.</p>
        </div>
      </div>
    </div>
  );
};
