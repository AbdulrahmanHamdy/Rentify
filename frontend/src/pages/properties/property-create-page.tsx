import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ArrowLeft, Save } from 'lucide-react';
import { propertySchema, type PropertyFormData } from '@/features/properties/schemas';
import { propertiesService } from '@/services/properties.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ErrorAlert } from '@/components/shared/error-alert';
import { queryClient } from '@/lib/query-client';

export const PropertyCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<unknown>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      description: '',
    },
  });

  const onSubmit = async (data: PropertyFormData) => {
    setApiError(null);
    try {
      const created = await propertiesService.createProperty(data);
      await queryClient.invalidateQueries({ queryKey: ['properties'] });
      navigate(`/properties/${created.id}`);
    } catch (err) {
      setApiError(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/properties"
          className="rounded-lg p-2 text-charcoal-500 hover:bg-charcoal-100 hover:text-charcoal-800 transition-colors"
          aria-label="Back to properties"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-charcoal-900">Add New Property</h1>
          <p className="text-xs text-charcoal-500">Register a new residential or commercial building</p>
        </div>
      </div>

      <ErrorAlert error={apiError} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-brand-600 mb-1">
            <Building2 className="w-5 h-5" />
            <CardTitle>Property Details</CardTitle>
          </div>
          <CardDescription>
            Enter the building information. You can add individual rental units right after saving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Property Name"
              placeholder="e.g. Al-Nour Tower, Sunset Villa"
              required
              error={errors.name?.message}
              {...register('name')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="City / District"
                placeholder="e.g. New Cairo, Zamalek"
                error={errors.city?.message}
                {...register('city')}
              />
              <Input
                label="Street Address"
                placeholder="e.g. 15 El-Tahrir Street"
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
                placeholder="Describe key features, nearby amenities, parking, security..."
                className="w-full rounded-lg border border-charcoal-300 p-3 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                {...register('description')}
              />
              {errors.description?.message && (
                <p className="text-xs text-red-600 font-medium">{errors.description.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-charcoal-100">
              <Link to="/properties">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                <Save className="w-4 h-4 mr-1.5" />
                Save Property
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
