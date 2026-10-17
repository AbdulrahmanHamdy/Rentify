import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 mb-4">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-charcoal-900">Access Restricted</h1>
      <p className="mt-2 text-sm text-charcoal-500 max-w-md">
        You do not have the required permissions or role to view this resource. Contact an administrator if you believe this is in error.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Link to="/dashboard">
          <Button variant="primary">
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
