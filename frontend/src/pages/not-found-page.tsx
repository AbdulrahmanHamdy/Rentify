import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-charcoal-100 text-charcoal-600 mb-4">
        <FileQuestion className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-charcoal-900">Page Not Found</h1>
      <p className="mt-2 text-sm text-charcoal-500 max-w-md">
        The page you are looking for does not exist, has been removed, or is temporarily unavailable.
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
