import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Key, Building2, CheckCircle } from 'lucide-react';
import { createContractSchema, type CreateContractFormData } from '@/features/contracts/schemas';
import { contractsService } from '@/services/contracts.service';
import { unitsService } from '@/services/units.service';
import { propertiesService } from '@/services/properties.service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ErrorAlert } from '@/components/shared/error-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';
import { queryClient } from '@/lib/query-client';

export const ContractCreatePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<unknown>(null);

  const initialUnitId = searchParams.get('unitId') ? parseInt(searchParams.get('unitId')!, 10) : undefined;

  // Defaults: start date = tomorrow, end date = 1 year later
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextYear = new Date(tomorrow);
  nextYear.setFullYear(nextYear.getFullYear() + 1);

  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  const nextYearStr = nextYear.toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateContractFormData>({
    resolver: zodResolver(createContractSchema),
    defaultValues: {
      unitId: initialUnitId || ('' as unknown as number),
      startDate: tomorrowStr,
      endDate: nextYearStr,
    },
  });

  const selectedUnitId = watch('unitId');
  const startDate = watch('startDate');
  const endDate = watch('endDate');

  // Fetch unit details if selected
  const unitIdNumber = Number(selectedUnitId);
  const { data: unit, isLoading: isLoadingUnit } = useQuery({
    queryKey: ['unit', unitIdNumber],
    queryFn: () => unitsService.getUnitById(unitIdNumber),
    enabled: !!unitIdNumber && !isNaN(unitIdNumber) && unitIdNumber > 0,
  });

  // Fetch parent property if unit fetched
  const propId = unit?.propertyId;
  const { data: property } = useQuery({
    queryKey: ['property', propId],
    queryFn: () => propertiesService.getPropertyById(propId!),
    enabled: typeof propId === 'number' && propId > 0,
  });

  useEffect(() => {
    if (initialUnitId) {
      setValue('unitId', initialUnitId);
    }
  }, [initialUnitId, setValue]);

  const onSubmit = async (data: CreateContractFormData) => {
    setApiError(null);
    try {
      const created = await contractsService.createContract({
        unitId: Number(data.unitId),
        startDate: data.startDate,
        endDate: data.endDate,
      });

      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      await queryClient.invalidateQueries({ queryKey: ['property-units'] });
      navigate(`/contracts/${created.id}`);
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
          <h1 className="text-xl font-bold text-charcoal-900">Apply to Rent Unit</h1>
          <p className="text-xs text-charcoal-500">
            Submit a rental contract application for property owner approval
          </p>
        </div>
      </div>

      <ErrorAlert error={apiError} />

      {/* Selected Unit Snapshot */}
      {isLoadingUnit ? (
        <Skeleton className="h-28 w-full rounded-xl" />
      ) : unit ? (
        <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-4">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 mb-1">
                <Building2 className="w-3.5 h-3.5" />
                <span>{property?.name || 'Selected Property'}</span>
              </div>
              <h2 className="text-base font-bold text-charcoal-900">Unit {unit.unitNumber}</h2>
              <p className="text-xs text-charcoal-500">
                {unit.areaSqm} m² • {unit.bedrooms} {unit.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'} • {unit.bathrooms} {unit.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-charcoal-500 block">Monthly Rent</span>
              <span className="text-base font-bold text-brand-700">
                {formatCurrency(unit.monthlyRent)}
              </span>
              <span className="text-[11px] text-charcoal-400 block">
                + {formatCurrency(unit.depositAmount)} deposit
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-brand-600 mb-1">
            <Key className="w-5 h-5" />
            <CardTitle>Tenancy Terms</CardTitle>
          </div>
          <CardDescription>
            Rental terms must span a minimum duration of 28 consecutive days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input
              label="Rental Unit ID"
              type="number"
              placeholder="e.g. 1"
              required
              error={errors.unitId?.message}
              {...register('unitId')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Start Date"
                type="date"
                required
                error={errors.startDate?.message}
                {...register('startDate')}
              />
              <Input
                label="End Date"
                type="date"
                required
                error={errors.endDate?.message}
                {...register('endDate')}
              />
            </div>

            {/* Term Summary Card */}
            {startDate && endDate && (
              <div className="rounded-lg bg-charcoal-50 p-3.5 text-xs border border-charcoal-200 space-y-1.5">
                <div className="flex justify-between text-charcoal-600">
                  <span>Selected Term:</span>
                  <span className="font-semibold text-charcoal-900">
                    {formatDate(startDate)} to {formatDate(endDate)}
                  </span>
                </div>
                <div className="flex justify-between text-charcoal-600">
                  <span>Initial Status:</span>
                  <span className="font-semibold text-amber-700">Pending Owner Approval</span>
                </div>
                <div className="flex justify-between text-charcoal-600">
                  <span>Unit Impact:</span>
                  <span className="font-semibold text-charcoal-900">Reserved upon submission</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-charcoal-100">
              <Link to="/properties">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Submit Application
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
