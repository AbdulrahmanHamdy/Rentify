import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Building2, ArrowLeft, Save } from 'lucide-react';
import { propertySchema, type PropertyFormData } from '@/features/properties/schemas';
import { propertiesService } from '@/services/properties.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ErrorAlert } from '@/components/shared/error-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { queryClient } from '@/lib/query-client';

export const PropertyEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const propertyId = parseInt(id || '', 10);
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<unknown>(null);

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: () => propertiesService.getPropertyById(propertyId),
    enabled: !isNaN(propertyId),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
  });

  useEffect(() => {
    if (property) {
      reset({
        name: property.name ?? '',
        address: property.address ?? '',
        city: property.city ?? '',
        description: property.description ?? '',
      });
    }
  }, [property, reset]);

  const onSubmit = async (data: PropertyFormData) => {
    setApiError(null);
    try {
      await propertiesService.updateProperty(propertyId, data);
      await queryClient.invalidateQueries({ queryKey: ['property', propertyId] });
      await queryClient.invalidateQueries({ queryKey: ['properties'] });
      navigate(`/properties/${propertyId}`);
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
          to={`/properties/${propertyId}`}
          className="rounded-lg p-2 text-charcoal-500 hover:bg-charcoal-100 hover:text-charcoal-800 transition-colors"
          aria-label="Back to property details"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-charcoal-900">Edit Property</h1>
          <p className="text-xs text-charcoal-500">Update details for {property?.name}</p>
        </div>
      </div>

      <ErrorAlert error={apiError} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-brand-600 mb-1">
            <Building2 className="w-5 h-5" />
            <CardTitle>Edit Information</CardTitle>
          </div>
          <CardDescription>Changes will take effect immediately across all public listings.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Property Name"
              required
              error={errors.name?.message}
              {...register('name')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="City / District"
                error={errors.city?.message}
                {...register('city')}
              />
              <Input
                label="Street Address"
                required
                error={errors.address?.message}
                {...register('address')}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="description"
                className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={4}
                className="w-full rounded-lg border border-charcoal-300 p-3 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                {...register('description')}
              />
              {errors.description?.message && (
                <p className="text-xs text-red-600 font-medium">{errors.description.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-charcoal-100">
              <Link to={`/properties/${propertyId}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                <Save className="w-4 h-4 mr-1.5" />
                Update Property
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
