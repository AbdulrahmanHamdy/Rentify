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
  Key,
  Camera,
  Image as ImageIcon,
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
import { ImageLightbox } from '@/components/shared/image-lightbox';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { queryClient } from '@/lib/query-client';
import type { UnitDto } from '@/types';

// Curated high resolution architectural photos for properties
const PROPERTY_GALLERY = [
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
];

export const PropertyDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const propertyId = parseInt(id || '', 10);
  const navigate = useNavigate();
  const { hasRole, primaryRole } = useAuth();
  const toast = useToast();

  const [deletePropertyDialogOpen, setDeletePropertyDialogOpen] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState<UnitDto | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);

  // Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

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
      toast.success('Property deleted successfully.');
      navigate('/properties');
    },
    onError: (err) => {
      setActionError(err);
      setDeletePropertyDialogOpen(false);
      toast.error('Failed to delete property. Check if active contracts exist.');
    },
  });

  // Delete Unit Mutation
  const deleteUnitMutation = useMutation({
    mutationFn: (unitId: number) => unitsService.deleteUnit(unitId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['property-units', propertyId] });
      await queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      setUnitToDelete(null);
      toast.success('Unit removed successfully.');
    },
    onError: (err) => {
      setActionError(err);
      setUnitToDelete(null);
      toast.error('Failed to delete unit. It may be reserved or leased.');
    },
  });

  const handleDeletePropertyConfirm = () => {
    deletePropertyMutation.mutate();
  };

  const handleDeleteUnitConfirm = () => {
    if (unitToDelete?.id) {
      deleteUnitMutation.mutate(unitToDelete.id);
    }
  };

  const openLightbox = (index: number) => {
    setActivePhotoIdx(index);
    setIsLightboxOpen(true);
  };

  if (isLoadingProperty) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
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
  const availableUnits = units.filter((u) => u.status === 'Available');

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

      {/* Property Imagery Gallery Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-charcoal-200 bg-charcoal-900">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-1.5 h-72 sm:h-80">
          {/* Main Large Photo */}
          <div
            onClick={() => openLightbox(0)}
            className="md:col-span-2 relative h-full cursor-pointer group overflow-hidden"
          >
            <img
              src={PROPERTY_GALLERY[0]}
              alt={property.name ?? 'Property'}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 via-transparent to-transparent flex items-end p-4">
              <span className="text-white text-xs font-semibold flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
                <Camera className="w-3.5 h-3.5" />
                Click to view gallery
              </span>
            </div>
          </div>

          {/* Secondary Photos */}
          <div
            onClick={() => openLightbox(1)}
            className="hidden md:block relative h-full cursor-pointer group overflow-hidden"
          >
            <img
              src={PROPERTY_GALLERY[1]}
              alt="Interior"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          <div
            onClick={() => openLightbox(2)}
            className="hidden md:block relative h-full cursor-pointer group overflow-hidden"
          >
            <img
              src={PROPERTY_GALLERY[2]}
              alt="Balcony view"
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/50 hover:bg-black/40 transition-colors flex flex-col items-center justify-center text-white p-2">
              <ImageIcon className="w-6 h-6 mb-1 text-brand-300" />
              <span className="text-xs font-bold">+{PROPERTY_GALLERY.length} Photos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Property Overview Card */}
      <div className="rounded-2xl border border-charcoal-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="brand" className="font-semibold">
                <Layers className="w-3 h-3 mr-1" />
                {property.unitCount} {property.unitCount === 1 ? 'Unit' : 'Units'}
              </Badge>
              {availableUnits.length > 0 && (
                <Badge variant="success">
                  {availableUnits.length} Available Now
                </Badge>
              )}
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
                    {/* Unit Spec Highlights */}
                    <div className="grid grid-cols-3 gap-1 py-2 border-y border-charcoal-100 text-center text-xs text-charcoal-600">
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-semibold text-charcoal-900">{unit.areaSqm} m²</span>
                        <span className="text-[10px] text-charcoal-400">Area</span>
                      </div>
                      <div className="flex flex-col items-center justify-center border-x border-charcoal-100">
                        <span className="font-semibold text-charcoal-900">{unit.bedrooms}</span>
                        <span className="text-[10px] text-charcoal-400">Beds</span>
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <span className="font-semibold text-charcoal-900">{unit.bathrooms}</span>
                        <span className="text-[10px] text-charcoal-400">Baths</span>
                      </div>
                    </div>

                    {/* Price and Deposit */}
                    <div className="flex items-baseline justify-between pt-1">
                      <div>
                        <span className="text-xs text-charcoal-500 block">Rent</span>
                        <span className="text-base font-bold text-brand-600">
                          {formatCurrency(unit.monthlyRent)}
                          <span className="text-[10px] font-normal text-charcoal-400">/mo</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-charcoal-400 block">Deposit</span>
                        <span className="text-xs font-semibold text-charcoal-700">
                          {formatCurrency(unit.depositAmount)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-charcoal-100 flex items-center justify-between gap-2">
                    <Link to={`/units/${unit.id}`} className="flex-1">
                      <Button variant="secondary" size="sm" className="w-full text-xs">
                        View Unit Details
                      </Button>
                    </Link>

                    {unit.status === 'Available' && primaryRole === 'Tenant' && (
                      <Link to={`/units/${unit.id}`}>
                        <Button variant="primary" size="sm" className="text-xs whitespace-nowrap">
                          <Key className="w-3.5 h-3.5 mr-1" />
                          Apply
                        </Button>
                      </Link>
                    )}

                    {canManage && (
                      <div className="flex items-center gap-1">
                        <Link to={`/units/${unit.id}/edit`}>
                          <Button variant="ghost" size="sm" className="p-1.5 h-auto text-charcoal-500 hover:text-charcoal-900">
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUnitToDelete(unit)}
                          className="p-1.5 h-auto text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Component */}
      <ImageLightbox
        images={PROPERTY_GALLERY}
        currentIndex={activePhotoIdx}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={(idx) => setActivePhotoIdx(idx)}
        title={property.name || 'Property Gallery'}
      />

      {/* Delete Property Confirmation Dialog */}
      <Dialog
        isOpen={deletePropertyDialogOpen}
        onClose={() => setDeletePropertyDialogOpen(false)}
        title="Delete Property"
        description="Are you sure you want to delete this property? This action is permanent and only allowed if there are no pending or active leases."
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setDeletePropertyDialogOpen(false)}
            disabled={deletePropertyMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeletePropertyConfirm}
            isLoading={deletePropertyMutation.isPending}
          >
            Yes, Delete Property
          </Button>
        </div>
      </Dialog>

      {/* Delete Unit Confirmation Dialog */}
      <Dialog
        isOpen={!!unitToDelete}
        onClose={() => setUnitToDelete(null)}
        title={`Delete Unit ${unitToDelete?.unitNumber}`}
        description="Are you sure you want to remove this unit? It must not be currently leased."
      >
        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => setUnitToDelete(null)}
            disabled={deleteUnitMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteUnitConfirm}
            isLoading={deleteUnitMutation.isPending}
          >
            Yes, Delete Unit
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
