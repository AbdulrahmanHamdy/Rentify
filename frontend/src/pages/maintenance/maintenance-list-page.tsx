import React from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench, Clock, CheckCircle, Hammer } from 'lucide-react';

export const MaintenanceListPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Requests"
        description="Track maintenance tickets, repair requests, and unit service operations"
      />

      {/* Backend API Status Banner */}
      <div className="rounded-xl border border-charcoal-200 bg-white p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-charcoal-100 text-charcoal-700 shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-charcoal-900">
                Maintenance Module Pending API Exposure
              </h2>
              <Badge variant="neutral">Phase In Progress</Badge>
            </div>
            <p className="text-xs text-charcoal-600 leading-relaxed max-w-2xl">
              The domain entity (`MaintenanceRequest`) and database schema are implemented in the Rentify backend, but the corresponding REST controllers (`/api/maintenance`) have not yet been exposed by the Web API.
            </p>
            <p className="text-xs text-charcoal-500">
              This gap is documented in <code className="bg-charcoal-100 px-1.5 py-0.5 rounded text-charcoal-800">BACKEND_GAPS.md</code>. Once the backend controller is added, this screen will connect seamlessly to tickets and dispatch.
            </p>
          </div>
        </div>
      </div>

      {/* Preview of Upcoming Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-brand-600 mb-1">
              <Hammer className="w-4 h-4" />
              <CardTitle className="text-sm">Ticket Filing</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Tenants will be able to file requests with photos and severity ratings.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-charcoal-500">
            Emergency plumbing, HVAC, electrical, and general repairs.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-brand-600 mb-1">
              <Clock className="w-4 h-4" />
              <CardTitle className="text-sm">Owner Triage</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Property owners review, approve, and assign contractor visits.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-charcoal-500">
            Real-time status updates from Pending to InProgress and Resolved.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-brand-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <CardTitle className="text-sm">Resolution History</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Audit log of completed repairs and cost history per rental unit.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-charcoal-500">
            Keeps an immutable track of property maintenance overhead.
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
