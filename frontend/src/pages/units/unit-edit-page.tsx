import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, Edit3 } from 'lucide-react';
import { updateUnitSchema, type UpdateUnitFormData } from '@/features/units/schemas';
import { unitsService } from '@/services/units.service';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ErrorAlert } from '@/components/shared/error-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { queryClient } from '@/lib/query-client';

export const UnitEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const unitId = parseInt(id || '', 10);
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<unknown>(null);

  const { data: unit, isLoading } = useQuery({
    queryKey: ['unit', unitId],
    queryFn: () => unitsService.getUnitById(unitId),
    enabled: !isNaN(unitId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateUnitFormData>({
    resolver: zodResolver(updateUnitSchema),
  });

  useEffect(() => {
    if (unit) {
      reset({
        unitNumber: unit.unitNumber ?? '',
        floor: unit.floor,
        areaSqm: unit.areaSqm ?? 0,
        bedrooms: unit.bedrooms ?? 0,
        bathrooms: unit.bathrooms ?? 0,
        monthlyRent: unit.monthlyRent ?? 0,
        depositAmount: unit.depositAmount ?? 0,
        status: (unit.status as 'Available' | 'Reserved' | 'Rented' | 'Maintenance') || 'Available',
      });
    }
  }, [unit, reset]);

  const onSubmit = async (data: UpdateUnitFormData) => {
    setApiError(null);
    try {
      await unitsService.updateUnit(unitId, {
        unitNumber: data.unitNumber,
        floor: data.floor ?? undefined,
        areaSqm: data.areaSqm,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        monthlyRent: data.monthlyRent,
        depositAmount: data.depositAmount,
        status: data.status,
      });

      await queryClient.invalidateQueries({ queryKey: ['unit', unitId] });
      await queryClient.invalidateQueries({ queryKey: ['property-units'] });
      navigate(unit?.propertyId ? `/properties/${unit.propertyId}` : '/properties');
    } catch (err) {
      setApiError(err);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={unit?.propertyId ? `/properties/${unit.propertyId}` : '/properties'}
          className="rounded-lg p-2 text-charcoal-500 hover:bg-charcoal-100 hover:text-charcoal-800 transition-colors"
          aria-label="Back to property"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-charcoal-900">Edit Unit {unit?.unitNumber}</h1>
          <p className="text-xs text-charcoal-500">Update specifications and operational status</p>
        </div>
      </div>

      <ErrorAlert error={apiError} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-brand-600 mb-1">
            <Edit3 className="w-5 h-5" />
            <CardTitle>Unit Settings</CardTitle>
          </div>
          <CardDescription>
            Note: The backend allows manual toggling between &quot;Available&quot; and &quot;Maintenance&quot;. &quot;Reserved&quot; and &quot;Rented&quot; are managed exclusively by the rental contract workflow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Unit Number / Name"
                required
                error={errors.unitNumber?.message}
                {...register('unitNumber')}
              />
              <Input
                label="Floor Level"
                type="number"
                error={errors.floor?.message}
                {...register('floor')}
              />
            </div>

            <Select
              label="Operational Status"
              required
              error={errors.status?.message}
              options={[
                { value: 'Available', label: 'Available — Ready for rent' },
                { value: 'Maintenance', label: 'Maintenance — Temporarily unavailable for repairs' },
                { value: 'Reserved', label: 'Reserved (Workflow controlled)' },
                { value: 'Rented', label: 'Rented (Workflow controlled)' },
              ]}
              {...register('status')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Area (m²)"
                type="number"
                step="0.1"
                required
                error={errors.areaSqm?.message}
                {...register('areaSqm')}
              />
              <Input
                label="Bedrooms"
                type="number"
                required
                error={errors.bedrooms?.message}
                {...register('bedrooms')}
              />
              <Input
                label="Bathrooms"
                type="number"
                required
                error={errors.bathrooms?.message}
                {...register('bathrooms')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Input
                label="Monthly Rent (EGP)"
                type="number"
                step="0.01"
                required
                error={errors.monthlyRent?.message}
                {...register('monthlyRent')}
              />
              <Input
                label="Security Deposit (EGP)"
                type="number"
                step="0.01"
                required
                error={errors.depositAmount?.message}
                {...register('depositAmount')}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-charcoal-100">
              <Link to={unit?.propertyId ? `/properties/${unit.propertyId}` : '/properties'}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                <Save className="w-4 h-4 mr-1.5" />
                Update Unit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
