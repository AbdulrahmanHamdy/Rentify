import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Building2,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Layers,
  ArrowLeft,
  Bed,
  Bath,
  Maximize2,
  Key,
} from 'lucide-react';
import { propertiesService } from '@/services/properties.service';
import { unitsService } from '@/services/units.service';
import { useAuth } from '@/features/auth/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/shared/error-alert';
import { EmptyState } from '@/components/shared/empty-state';
import { formatCurrency, formatDate } from '@/lib/utils';
import { queryClient } from '@/lib/query-client';
import type { UnitDto } from '@/types';

export const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const propertyId = parseInt(id || '', 10);
  const navigate = useNavigate();
  const { hasRole, primaryRole } = useAuth();

  const [deletePropertyDialogOpen, setDeletePropertyDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<UnitDto | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);

  const canManage = hasRole('Owner') || hasRole('Admin');

  // Fetch Property
  const {
    data: property,
    isLoading: isLoadingProperty,
    error: propertyError,
  } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertiesService.getPropertyById(propertyId),
    enabled: !isNaN(propertyId),
  });

  // Fetch Units for this Property
  const {
    data: unitsData,
    isLoading: isLoadingUnits,
    error: unitsError,
  } = useQuery({
    queryKey: ['property-units', propertyId],
    queryFn: () => propertiesService.getPropertyUnits(propertyId, { pageSize: 50 }),
    enabled: !isNaN(propertyId),
  });

  // Delete Property Mutation
  const deletePropertyMutation = useMutation({
    mutationFn: () => propertiesService.deleteProperty(propertyId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['properties'] });
      navigate('/properties');
    },
    onError: (err) => {
      setActionError(err);
      setDeletePropertyDialogOpen(false);
    },
  });

  // Delete Unit Mutation
  const deleteUnitMutation = useMutation({
    mutationFn: (unitId: number) => unitsService.deleteUnit(unitId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['property-units', propertyId] });
      await queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      setUnitToDelete(null);
    },
    onError: (err) => {
      setActionError(err);
      setUnitToDelete(null);
    },
  });

  if (isLoadingProperty) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (propertyError || !property) {
    return (
      <div className="space-y-4">
        <ErrorAlert error={propertyError || new Error('Property not found')} />
        <Link to="/properties">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
        </Link>
      </div>
    );
  }

  const units = unitsData?.items || [];

  return (
    <div className="space-y-8">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/properties"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-600 hover:text-charcoal-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Properties</span>
        </Link>

        {canManage && (
          <div className="flex items-center gap-2">
            <Link to={`/properties/${property.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                Edit
              </Button>
            </Link>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeletePropertyDialogOpen(true)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <ErrorAlert error={actionError} onDismiss={() => setActionError(null)} />

      {/* Property Overview Card */}
      <div className="rounded-2xl border border-charcoal-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="brand" className="font-semibold">
                <Layers className="w-3 h-3 mr-1" />
                {property.unitCount} {property.unitCount === 1 ? 'Unit' : 'Units'}
              </Badge>
              <span className="text-xs text-charcoal-400">Added on {formatDate(property.createdAt)}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal-900">
              {property.name}
            </h1>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-charcoal-600">
              <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
              <span>
                {property.address}
                {property.city ? `, ${property.city}` : ''}
              </span>
            </div>
          </div>
        </div>

        {property.description && (
          <div className="mt-6 pt-6 border-t border-charcoal-100">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-charcoal-500 mb-2">About this Property</h2>
            <p className="text-sm text-charcoal-700 leading-relaxed whitespace-pre-line">
              {property.description}
            </p>
          </div>
        )}
      </div>

      {/* Units Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-charcoal-900">Rental Units</h2>
            <p className="text-xs text-charcoal-500">
              Individual apartments, suites, or commercial spaces inside {property.name}
            </p>
          </div>
          {canManage && (
            <Link to={`/properties/${property.id}/units/create`}>
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Unit
              </Button>
            </Link>
          )}
        </div>

        <ErrorAlert error={unitsError} />

        {isLoadingUnits ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-44 w-full rounded-xl" />
            ))}
          </div>
        ) : units.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No units created yet"
            description={
              canManage
                ? 'This property has no units listed yet. Click Add Unit to create your first rentable unit.'
                : 'There are currently no units available for rent in this property.'
            }
            action={
              canManage ? (
                <Link to={`/properties/${property.id}/units/create`}>
                  <Button variant="primary" size="sm">
                    <Plus className="w-4 h-4 mr-1.5" />
                    Create First Unit
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {units.map((unit) => (
              <Card key={unit.id} className="hover:border-charcoal-300 transition-all flex flex-col">
                <CardHeader className="p-4 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Unit {unit.unitNumber}</CardTitle>
                      {unit.floor !== null && unit.floor !== undefined && (
                        <span className="text-xs text-charcoal-500">Floor {unit.floor}</span>
                      )}
                    </div>
                    <StatusBadge status={unit.status || ''} type="unit" />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Specs Pills */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-600 bg-charcoal-50 p-2.5 rounded-lg border border-charcoal-100">
                      <div className="flex items-center gap-1">
                        <Maximize2 className="w-3.5 h-3.5 text-charcoal-400" />
                        <span>{unit.areaSqm} m²</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5 text-charcoal-400" />
                        <span>{unit.bedrooms} {unit.bedrooms === 1 ? 'Bed' : 'Beds'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Bath className="w-3.5 h-3.5 text-charcoal-400" />
                        <span>{unit.bathrooms} {unit.bathrooms === 1 ? 'Bath' : 'Baths'}</span>
                      </div>
                    </div>

                    {/* Financials */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div>
                        <span className="text-charcoal-500 block">Monthly Rent</span>
                        <span className="text-base font-bold text-brand-700">
                          {formatCurrency(unit.monthlyRent)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-charcoal-500 block">Deposit</span>
                        <span className="font-semibold text-charcoal-800">
                          {formatCurrency(unit.depositAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-charcoal-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/units/${unit.id}`}
                      className="text-xs font-semibold text-charcoal-600 hover:text-charcoal-900"
                    >
                      View Details
                    </Link>

                    <div className="flex items-center gap-1.5">
                      {unit.status === 'Available' && primaryRole === 'Tenant' && (
                        <Link to={`/contracts/create?unitId=${unit.id}`}>
                          <Button variant="primary" size="sm" className="h-7 text-xs px-2.5">
                            <Key className="w-3 h-3 mr-1" />
                            Apply
                          </Button>
                        </Link>
                      )}

                      {canManage && (
                        <>
                          <Link to={`/units/${unit.id}/edit`}>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="Edit unit">
                              <Edit2 className="w-3.5 h-3.5 text-charcoal-500" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:text-red-600"
                            title="Delete unit"
                            onClick={() => setUnitToDelete(unit)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Property Confirmation Modal */}
      <Dialog
        isOpen={deletePropertyDialogOpen}
        onClose={() => setDeletePropertyDialogOpen(false)}
        title="Delete Property"
        description={`Are you sure you want to delete "${property.name}"?`}
      >
        <div className="space-y-4">
          <p className="text-sm text-charcoal-600">
            This will soft-delete the property. If any units have pending or active contracts, the deletion will be rejected by the server to protect active leases.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-charcoal-100">
            <Button
              variant="outline"
              onClick={() => setDeletePropertyDialogOpen(false)}
              disabled={deletePropertyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deletePropertyMutation.mutate()}
              isLoading={deletePropertyMutation.isPending}
            >
              Confirm Deletion
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Unit Confirmation Modal */}
      <Dialog
        isOpen={!!unitToDelete}
        onClose={() => setUnitToDelete(null)}
        title="Delete Rental Unit"
        description={`Are you sure you want to delete Unit ${unitToDelete?.unitNumber}?`}
      >
        <div className="space-y-4">
          <p className="text-sm text-charcoal-600">
            This operation cannot be undone. Units associated with pending or active rental contracts cannot be deleted.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-charcoal-100">
            <Button
              variant="outline"
              onClick={() => setUnitToDelete(null)}
              disabled={deleteUnitMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => unitToDelete && typeof unitToDelete.id === 'number' && deleteUnitMutation.mutate(unitToDelete.id)}
              isLoading={deleteUnitMutation.isPending}
            >
              Confirm Deletion
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
