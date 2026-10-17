import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Bed,
  Bath,
  Maximize2,
  Key,
  Edit2,
} from 'lucide-react';
import { unitsService } from '@/services/units.service';
import { useAuth } from '@/features/auth/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/shared/error-alert';
import { formatCurrency, formatDate } from '@/lib/utils';

export const UnitDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const unitId = parseInt(id || '', 10);
  const { hasRole, primaryRole } = useAuth();

  const canManage = hasRole('Owner') || hasRole('Admin');

  const { data: unit, isLoading, error } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: () => unitsService.getUnitById(unitId),
    enabled: !isNaN(unitId),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <ErrorAlert error={error || new Error('Unit not found')} />
        <Link to="/properties">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to={`/properties/${unit.propertyId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-600 hover:text-charcoal-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Property</span>
        </Link>

        {canManage && (
          <Link to={`/units/${unit.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit2 className="w-3.5 h-3.5 mr-1" />
              Edit Unit
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                  Rental Unit
                </span>
                <span className="text-xs text-charcoal-400">Listed {formatDate(unit.createdAt)}</span>
              </div>
              <CardTitle className="text-2xl">Unit {unit.unitNumber}</CardTitle>
              {unit.floor !== null && unit.floor !== undefined && (
                <CardDescription>Located on floor {unit.floor}</CardDescription>
              )}
            </div>
            <StatusBadge status={unit.status || ''} type="unit" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Specifications Grid */}
          <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-charcoal-50 border border-charcoal-100 text-center">
            <div className="space-y-1">
              <Maximize2 className="w-5 h-5 mx-auto text-charcoal-500" />
              <span className="text-xs text-charcoal-500 block">Area</span>
              <span className="text-sm font-bold text-charcoal-900">{unit.areaSqm} m²</span>
            </div>
            <div className="space-y-1 border-x border-charcoal-200">
              <Bed className="w-5 h-5 mx-auto text-charcoal-500" />
              <span className="text-xs text-charcoal-500 block">Bedrooms</span>
              <span className="text-sm font-bold text-charcoal-900">{unit.bedrooms}</span>
            </div>
            <div className="space-y-1">
              <Bath className="w-5 h-5 mx-auto text-charcoal-500" />
              <span className="text-xs text-charcoal-500 block">Bathrooms</span>
              <span className="text-sm font-bold text-charcoal-900">{unit.bathrooms}</span>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="flex items-center justify-between p-5 rounded-xl border border-brand-200 bg-brand-50/50">
            <div>
              <span className="text-xs text-brand-700 font-medium block">Monthly Rent</span>
              <span className="text-2xl font-bold text-brand-900">
                {formatCurrency(unit.monthlyRent)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-charcoal-500 block">Security Deposit</span>
              <span className="text-lg font-bold text-charcoal-800">
                {formatCurrency(unit.depositAmount)}
              </span>
            </div>
          </div>

          {/* Action Call to Action */}
          <div className="pt-4 border-t border-charcoal-100 flex items-center justify-between">
            <Link
              to={`/properties/${unit.propertyId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              <Building2 className="w-4 h-4" />
              <span>View Parent Property</span>
            </Link>

            {unit.status === 'Available' && primaryRole === 'Tenant' && (
              <Link to={`/contracts/create?unitId=${unit.id}`}>
                <Button variant="primary">
                  <Key className="w-4 h-4 mr-1.5" />
                  Apply to Rent this Unit
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
