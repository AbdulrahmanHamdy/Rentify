import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import { createUnitSchema, type CreateUnitFormData } from '@/features/units/schemas';
import { propertiesService } from '@/services/properties.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ErrorAlert } from '@/components/shared/error-alert';
import { queryClient } from '@/lib/query-client';

export const UnitCreatePage: React.FC = () => {
  const { propertyId: propIdParam } = useParams<{ propertyId: string }>();
  const propertyId = parseInt(propIdParam || '', 10);
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<unknown>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUnitFormData>({
    resolver: zodResolver(createUnitSchema),
    defaultValues: {
      unitNumber: '',
      floor: 1,
      areaSqm: 80,
      bedrooms: 2,
      bathrooms: 1,
      monthlyRent: 5000,
      depositAmount: 5000,
    },
  });

  const onSubmit = async (data: CreateUnitFormData) => {
    setApiError(null);
    try {
      await propertiesService.createPropertyUnit(propertyId, {
        unitNumber: data.unitNumber,
        floor: data.floor ?? undefined,
        areaSqm: data.areaSqm,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        monthlyRent: data.monthlyRent,
        depositAmount: data.depositAmount,
      });

      await queryClient.invalidateQueries({ queryKey: ['property-units', propertyId] });
      await queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      navigate(`/properties/${propertyId}`);
    } catch (err) {
      setApiError(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to={`/properties/${propertyId}`}
          className="rounded-lg p-2 text-charcoal-500 hover:bg-charcoal-100 hover:text-charcoal-800 transition-colors"
          aria-label="Back to property"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-charcoal-900">Add Rental Unit</h1>
          <p className="text-xs text-charcoal-500">Configure specifications and rental terms for this unit</p>
        </div>
      </div>

      <ErrorAlert error={apiError} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-brand-600 mb-1">
            <Plus className="w-5 h-5" />
            <CardTitle>Unit Specifications</CardTitle>
          </div>
          <CardDescription>
            Newly added units automatically start with status &quot;Available&quot;.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Unit Number / Name"
                placeholder="e.g. 101, A-12, Suite 3B"
                required
                error={errors.unitNumber?.message}
                {...register('unitNumber')}
              />
              <Input
                label="Floor Level"
                type="number"
                placeholder="e.g. 1, 2, -1"
                error={errors.floor?.message}
                {...register('floor')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Area (m²)"
                type="number"
                step="0.1"
                placeholder="80"
                required
                error={errors.areaSqm?.message}
                {...register('areaSqm')}
              />
              <Input
                label="Bedrooms"
                type="number"
                placeholder="2"
                required
                error={errors.bedrooms?.message}
                {...register('bedrooms')}
              />
              <Input
                label="Bathrooms"
                type="number"
                placeholder="1"
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
                placeholder="5000"
                required
                error={errors.monthlyRent?.message}
                {...register('monthlyRent')}
              />
              <Input
                label="Security Deposit (EGP)"
                type="number"
                step="0.01"
                placeholder="5000"
                required
                error={errors.depositAmount?.message}
                {...register('depositAmount')}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-charcoal-100">
              <Link to={`/properties/${propertyId}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                <Save className="w-4 h-4 mr-1.5" />
                Save Unit
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
