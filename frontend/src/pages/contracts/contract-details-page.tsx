import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Building2,
  Calendar,
  CheckCircle,
  XCircle,
  PowerOff,
  ArrowLeft,
  Key,
} from 'lucide-react';
import { contractsService } from '@/services/contracts.service';
import { useAuth } from '@/features/auth/use-auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/shared/error-alert';
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils';
import { queryClient } from '@/lib/query-client';

export const ContractDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const contractId = parseInt(id || '', 10);
  const { hasRole } = useAuth();

  const isOwnerOrAdmin = hasRole('Owner') || hasRole('Admin');

  const [confirmAction, setConfirmAction] = useState<'activate' | 'terminate' | 'cancel' | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);

  const {
    data: contract,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['contract', contractId],
    queryFn: () => contractsService.getContractById(contractId),
    enabled: !isNaN(contractId),
  });

  const activateMutation = useMutation({
    mutationFn: () => contractsService.activateContract(contractId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setConfirmAction(null);
    },
    onError: (err) => setActionError(err),
  });

  const terminateMutation = useMutation({
    mutationFn: () => contractsService.terminateContract(contractId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setConfirmAction(null);
    },
    onError: (err) => setActionError(err),
  });

  const cancelMutation = useMutation({
    mutationFn: () => contractsService.cancelContract(contractId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contract', contractId] });
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setConfirmAction(null);
    },
    onError: (err) => setActionError(err),
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <ErrorAlert error={error || new Error('Contract not found or you lack permission to view it')} />
        <Link to="/contracts">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Contracts
          </Button>
        </Link>
      </div>
    );
  }

  const isPendingMutation =
    activateMutation.isPending || terminateMutation.isPending || cancelMutation.isPending;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/contracts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-600 hover:text-charcoal-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Contracts</span>
        </Link>
      </div>

      <ErrorAlert error={actionError} onDismiss={() => setActionError(null)} />

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                  Lease Agreement #{contract.id}
                </span>
                <span className="text-xs text-charcoal-400">Created {formatDate(contract.createdAt)}</span>
              </div>
              <CardTitle className="text-2xl">{contract.propertyName}</CardTitle>
              <CardDescription>Unit {contract.unitNumber}</CardDescription>
            </div>
            <StatusBadge status={contract.status || ''} type="contract" />
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Term Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-charcoal-50 border border-charcoal-200">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500 block">
                Start Date
              </span>
              <div className="flex items-center gap-2 text-sm font-bold text-charcoal-900">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>{formatDate(contract.startDate)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500 block">
                End Date
              </span>
              <div className="flex items-center gap-2 text-sm font-bold text-charcoal-900">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>{formatDate(contract.endDate)}</span>
              </div>
            </div>
          </div>

          {/* Pricing Box */}
          <div className="flex items-center justify-between p-5 rounded-xl border border-brand-200 bg-brand-50/50">
            <div>
              <span className="text-xs text-brand-700 font-medium block">Monthly Rent</span>
              <span className="text-2xl font-bold text-brand-900">
                {formatCurrency(contract.monthlyRent)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-charcoal-500 block">Security Deposit</span>
              <span className="text-lg font-bold text-charcoal-800">
                {formatCurrency(contract.securityDeposit)}
              </span>
            </div>
          </div>

          {/* Associated Entities Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link
              to={`/properties/${contract.propertyId}`}
              className="flex items-center justify-between p-3.5 rounded-xl border border-charcoal-200 hover:border-brand-500 hover:bg-brand-50/20 transition-all text-xs"
            >
              <div className="flex items-center gap-2 text-charcoal-800 font-medium">
                <Building2 className="w-4 h-4 text-brand-600" />
                <span>View Property Listing</span>
              </div>
              <span className="text-brand-600 font-semibold">Open →</span>
            </Link>

            <Link
              to={`/units/${contract.unitId}`}
              className="flex items-center justify-between p-3.5 rounded-xl border border-charcoal-200 hover:border-brand-500 hover:bg-brand-50/20 transition-all text-xs"
            >
              <div className="flex items-center gap-2 text-charcoal-800 font-medium">
                <Key className="w-4 h-4 text-brand-600" />
                <span>View Unit Specifications</span>
              </div>
              <span className="text-brand-600 font-semibold">Open →</span>
            </Link>
          </div>

          {/* Workflow Action Buttons */}
          <div className="pt-6 border-t border-charcoal-100 flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-charcoal-500">
              Last updated: {contract.updatedAt ? formatDateTime(contract.updatedAt) : 'Never modified'}
            </span>

            <div className="flex items-center gap-2">
              {contract.status === 'Pending' && isOwnerOrAdmin && (
                <Button
                  variant="primary"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setConfirmAction('activate')}
                >
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                  Approve & Activate
                </Button>
              )}

              {contract.status === 'Active' && isOwnerOrAdmin && (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmAction('terminate')}
                >
                  <PowerOff className="w-4 h-4 mr-1.5" />
                  Terminate Lease
                </Button>
              )}

              {contract.status === 'Pending' && (
                <Button
                  variant="outline"
                  onClick={() => setConfirmAction('cancel')}
                >
                  <XCircle className="w-4 h-4 mr-1.5 text-red-500" />
                  Cancel Application
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction === 'activate'
            ? 'Activate Rental Agreement'
            : confirmAction === 'terminate'
            ? 'Terminate Active Lease'
            : 'Cancel Rental Application'
        }
        description={
          confirmAction === 'activate'
            ? `Approve contract #${contract.id}? This will transition unit ${contract.unitNumber} into "Rented" status.`
            : confirmAction === 'terminate'
            ? `Terminate contract #${contract.id}? This will release unit ${contract.unitNumber} back to "Available" status.`
            : `Cancel pending contract #${contract.id}? The unit reservation will be cancelled.`
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-charcoal-600">
            This operation will be recorded immediately in the database audit log.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-charcoal-100">
            <Button
              variant="outline"
              onClick={() => setConfirmAction(null)}
              disabled={isPendingMutation}
            >
              Back
            </Button>
            <Button
              variant={confirmAction === 'activate' ? 'primary' : 'destructive'}
              onClick={() => {
                setActionError(null);
                if (confirmAction === 'activate') activateMutation.mutate();
                if (confirmAction === 'terminate') terminateMutation.mutate();
                if (confirmAction === 'cancel') cancelMutation.mutate();
              }}
              isLoading={isPendingMutation}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
