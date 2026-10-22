import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  ArrowLeft,
  Building2,
  Bed,
  Bath,
  Maximize2,
  Key,
  Edit2,
  Calendar,
  Camera,
} from 'lucide-react';
import { unitsService } from '@/services/units.service';
import { propertiesService } from '@/services/properties.service';
import { contractsService } from '@/services/contracts.service';
import { useAuth } from '@/features/auth/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/shared/error-alert';
import { ImageLightbox } from '@/components/shared/image-lightbox';
import { useToast } from '@/components/ui/toast';
import { formatCurrency, formatDate } from '@/lib/utils';
import { queryClient } from '@/lib/query-client';

const UNIT_PHOTOS = [
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
];

export const UnitDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const unitId = parseInt(id || '', 10);
  const navigate = useNavigate();
  const { hasRole, primaryRole } = useAuth();
  const toast = useToast();

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Application form state
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultStart = tomorrow.toISOString().split('T')[0];

  const oneYear = new Date(tomorrow);
  oneYear.setFullYear(oneYear.getFullYear() + 1);
  const defaultEnd = oneYear.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultStart);
  const [durationMonths, setDurationMonths] = useState<number>(12);
  const [applyError, setApplyError] = useState<unknown>(null);

  const canManage = hasRole('Owner') || hasRole('Admin');

  const { data: unit, isLoading, error } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: () => unitsService.getUnitById(unitId),
    enabled: !isNaN(unitId),
  });

  const propId = unit?.propertyId;
  const { data: property } = useQuery({
    queryKey: ['property', propId],
    queryFn: () => propertiesService.getPropertyById(propId!),
    enabled: typeof propId === 'number' && propId > 0,
  });

  // Calculate calculated end date based on duration
  const calculatedEndDate = (() => {
    try {
      const s = new Date(startDate);
      s.setMonth(s.getMonth() + durationMonths);
      return s.toISOString().split('T')[0];
    } catch {
      return defaultEnd;
    }
  })();

  // Apply lease mutation
  const applyLeaseMutation = useMutation({
    mutationFn: () =>
      contractsService.createContract({
        unitId,
        startDate: startDate,
        endDate: calculatedEndDate,
      }),
    onSuccess: async (contract) => {
      await queryClient.invalidateQueries({ queryKey: ['unit', unitId] });
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setIsApplyModalOpen(false);
      toast.success('Lease application submitted! The owner will review your contract.');
      navigate(`/contracts/${contract.id}`);
    },
    onError: (err) => {
      setApplyError(err);
      toast.error('Failed to submit application. Ensure all profile info is set.');
    },
  });

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setApplyError(null);
    applyLeaseMutation.mutate();
  };

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
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to={`/properties/${unit.propertyId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-600 hover:text-charcoal-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to {property?.name || 'Property'}</span>
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

      {/* Unit Photo Gallery Header */}
      <div
        onClick={() => {
          setPhotoIndex(0);
          setIsLightboxOpen(true);
        }}
        className="relative rounded-2xl overflow-hidden h-64 sm:h-72 bg-charcoal-900 cursor-pointer group shadow-sm border border-charcoal-200"
      >
        <img
          src={UNIT_PHOTOS[0]}
          alt={`Unit ${unit.unitNumber}`}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-transparent to-transparent flex items-end justify-between p-5 text-white">
          <div>
            <span className="text-xs font-semibold bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full border border-white/20">
              Unit {unit.unitNumber}
            </span>
            <h2 className="text-xl font-bold mt-1.5">{property?.name || 'Residence'}</h2>
          </div>
          <span className="text-xs font-semibold flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-3 py-1.5 rounded-full border border-white/20">
            <Camera className="w-3.5 h-3.5" />
            View Photos
          </span>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                  Rental Specification
                </span>
                <span className="text-xs text-charcoal-400">Listed {formatDate(unit.createdAt)}</span>
              </div>
              <CardTitle className="text-2xl">Unit {unit.unitNumber}</CardTitle>
              {unit.floor !== null && unit.floor !== undefined && (
                <CardDescription>Floor {unit.floor} • {property?.address}</CardDescription>
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
          <div className="flex items-center justify-between p-5 rounded-2xl border border-brand-200 bg-brand-50/50">
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

          {/* Action CTA */}
          <div className="pt-4 border-t border-charcoal-100 flex items-center justify-between">
            <Link
              to={`/properties/${unit.propertyId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-800"
            >
              <Building2 className="w-4 h-4" />
              <span>View Parent Property</span>
            </Link>

            {unit.status === 'Available' && primaryRole === 'Tenant' && (
              <Button
                variant="primary"
                onClick={() => setIsApplyModalOpen(true)}
                className="shadow-md shadow-brand-500/20"
              >
                <Key className="w-4 h-4 mr-1.5" />
                Apply to Lease this Unit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Image Lightbox */}
      <ImageLightbox
        images={UNIT_PHOTOS}
        currentIndex={photoIndex}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
        onNavigate={(idx) => setPhotoIndex(idx)}
        title={`Unit ${unit.unitNumber} - ${property?.name || 'Property'}`}
      />

      {/* One-Click Lease Application Dialog */}
      <Dialog
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title={`Apply for Lease — Unit ${unit.unitNumber}`}
        description="Review the legally binding lease terms below before submitting your rental request to the owner."
      >
        <form onSubmit={handleApplySubmit} className="space-y-4 mt-4">
          <ErrorAlert error={applyError} />

          {/* Summary Financials Banner */}
          <div className="p-4 rounded-xl bg-charcoal-50 border border-charcoal-200 text-xs space-y-2">
            <div className="flex justify-between text-charcoal-600">
              <span>Monthly Rental Rate:</span>
              <span className="font-semibold text-charcoal-900">{formatCurrency(unit.monthlyRent)}</span>
            </div>
            <div className="flex justify-between text-charcoal-600">
              <span>Security Deposit:</span>
              <span className="font-semibold text-charcoal-900">{formatCurrency(unit.depositAmount)}</span>
            </div>
            <div className="pt-2 border-t border-charcoal-200 flex justify-between font-bold text-sm text-brand-900">
              <span>Initial Due at Signing:</span>
              <span>{formatCurrency((unit.monthlyRent ?? 0) + (unit.depositAmount ?? 0))}</span>
            </div>
          </div>

          {/* Lease Term Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Lease Start Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                min={defaultStart}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-charcoal-300 bg-white px-3.5 py-2 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
                Lease Duration
              </label>
              <select
                value={durationMonths}
                onChange={(e) => setDurationMonths(Number(e.target.value))}
                className="w-full rounded-lg border border-charcoal-300 bg-white px-3.5 py-2 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value={6}>6 Months</option>
                <option value={12}>12 Months (Standard)</option>
                <option value={24}>24 Months (2 Years)</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-charcoal-500 bg-brand-50/60 p-3 rounded-lg border border-brand-200 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600 shrink-0" />
            <span>
              Estimated contract expiration date:{' '}
              <strong className="text-charcoal-900">{formatDate(calculatedEndDate)}</strong>
            </span>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-charcoal-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApplyModalOpen(false)}
              disabled={applyLeaseMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={applyLeaseMutation.isPending}
            >
              Confirm & Submit Application
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
