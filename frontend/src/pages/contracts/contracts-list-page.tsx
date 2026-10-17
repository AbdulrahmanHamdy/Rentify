import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import {
  FileText,
  Search,
  CheckCircle,
  XCircle,
  PowerOff,
  Eye,
} from 'lucide-react';
import { contractsService } from '@/services/contracts.service';
import { useAuth } from '@/features/auth/use-auth';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { ErrorAlert } from '@/components/shared/error-alert';
import { formatDate, formatCurrency } from '@/lib/utils';
import { queryClient } from '@/lib/query-client';
import type { ContractDto, ContractStatus } from '@/types';

export const ContractsListPage: React.FC = () => {
  const { hasRole, primaryRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isOwnerOrAdmin = hasRole('Owner') || hasRole('Admin');

  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const status = (searchParams.get('status') as ContractStatus) || undefined;
  const sortBy = searchParams.get('sortBy') || '';

  const [searchInput, setSearchInput] = useState(search);
  const [selectedContract, setSelectedContract] = useState<{
    contract: ContractDto;
    action: 'activate' | 'terminate' | 'cancel';
  } | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);

  // Sync debounced search to query parameters
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchInput.trim()) {
          next.set('search', searchInput.trim());
        } else {
          next.delete('search');
        }
        next.set('page', '1');
        return next;
      });
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, setSearchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['contracts', { page, pageSize: 10, search, status, sortBy }],
    queryFn: () =>
      contractsService.getContracts({
        page,
        pageSize: 10,
        search,
        status,
        sortBy,
      }),
  });

  // Action Mutations
  const activateMutation = useMutation({
    mutationFn: (id: number) => contractsService.activateContract(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setSelectedContract(null);
    },
    onError: (err) => setActionError(err),
  });

  const terminateMutation = useMutation({
    mutationFn: (id: number) => contractsService.terminateContract(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setSelectedContract(null);
    },
    onError: (err) => setActionError(err),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => contractsService.cancelContract(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setSelectedContract(null);
    },
    onError: (err) => setActionError(err),
  });

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', newPage.toString());
      return next;
    });
  };

  const handleStatusFilter = (newStatus: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newStatus) {
        next.set('status', newStatus);
      } else {
        next.delete('status');
      }
      next.set('page', '1');
      return next;
    });
  };

  const executeAction = () => {
    if (!selectedContract || typeof selectedContract.contract.id !== 'number') return;
    setActionError(null);
    const contractId = selectedContract.contract.id;
    if (selectedContract.action === 'activate') {
      activateMutation.mutate(contractId);
    } else if (selectedContract.action === 'terminate') {
      terminateMutation.mutate(contractId);
    } else if (selectedContract.action === 'cancel') {
      cancelMutation.mutate(contractId);
    }
  };

  const isPendingMutation =
    activateMutation.isPending || terminateMutation.isPending || cancelMutation.isPending;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rental Contracts"
        description="Review lease agreements, track approvals, and manage active tenancy terms"
      />

      <ErrorAlert error={actionError} onDismiss={() => setActionError(null)} />
      <ErrorAlert error={error} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-charcoal-200 shadow-xs">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search by unit number or property name..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-charcoal-300 bg-white placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {/* Status Tabs */}
          <div className="flex items-center rounded-lg border border-charcoal-300 p-0.5 bg-charcoal-100/60 text-xs font-semibold overflow-x-auto">
            {['', 'Pending', 'Active', 'Terminated', 'Cancelled'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => handleStatusFilter(st)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  (status === st || (!status && st === ''))
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                {st || 'All'}
              </button>
            ))}
          </div>

          <select
            value={sortBy}
            onChange={(e) => {
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                if (e.target.value) next.set('sortBy', e.target.value);
                else next.delete('sortBy');
                return next;
              });
            }}
            aria-label="Sort contracts"
            className="text-xs rounded-lg border border-charcoal-300 bg-white px-3 py-2 text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Default Sort</option>
            <option value="startDate">Sort by Start Date</option>
            <option value="endDate">Sort by End Date</option>
            <option value="monthlyRent">Sort by Rent</option>
            <option value="createdAt">Sort by Created At</option>
          </select>
        </div>
      </div>

      {/* Contracts Table */}
      {isLoading ? (
        <div className="rounded-xl border border-charcoal-200 bg-white p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      ) : data?.items?.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No contracts found"
          description={
            search || status
              ? 'No contracts matched your active filters. Try adjusting or clearing search parameters.'
              : primaryRole === 'Tenant'
              ? 'You have not submitted any rental applications yet. Explore properties to find your ideal unit.'
              : 'There are currently no rental contracts recorded for your properties.'
          }
          action={
            primaryRole === 'Tenant' ? (
              <Link to="/properties">
                <Button variant="primary">Browse Available Properties</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-charcoal-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-charcoal-50 border-b border-charcoal-200 text-charcoal-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Property & Unit</th>
                  <th className="px-5 py-3.5">Rental Term</th>
                  <th className="px-5 py-3.5">Monthly Rent</th>
                  <th className="px-5 py-3.5">Deposit</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Workflow Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100 text-charcoal-700">
                {data?.items?.map((contract) => (
                  <tr key={contract.id} className="hover:bg-charcoal-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-charcoal-900 text-sm">{contract.propertyName}</p>
                      <p className="text-charcoal-500">Unit: {contract.unitNumber}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-charcoal-800">{formatDate(contract.startDate)}</p>
                      <p className="text-charcoal-400 text-[11px]">to {formatDate(contract.endDate)}</p>
                    </td>
                    <td className="px-5 py-4 font-bold text-brand-700 text-sm">
                      {formatCurrency(contract.monthlyRent)}
                    </td>
                    <td className="px-5 py-4 font-medium text-charcoal-800">
                      {formatCurrency(contract.securityDeposit)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={contract.status || ''} type="contract" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/contracts/${contract.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 px-2.5 text-charcoal-600">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            Details
                          </Button>
                        </Link>

                        {/* Owner / Admin Activate */}
                        {contract.status === 'Pending' && isOwnerOrAdmin && (
                          <Button
                            variant="primary"
                            size="sm"
                            className="h-8 px-2.5 bg-emerald-600 hover:bg-emerald-700"
                            onClick={() => setSelectedContract({ contract, action: 'activate' })}
                          >
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            Activate
                          </Button>
                        )}

                        {/* Owner / Admin Terminate */}
                        {contract.status === 'Active' && isOwnerOrAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => setSelectedContract({ contract, action: 'terminate' })}
                          >
                            <PowerOff className="w-3.5 h-3.5 mr-1" />
                            Terminate
                          </Button>
                        )}

                        {/* Cancel for Pending */}
                        {contract.status === 'Pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2.5 text-charcoal-500 hover:text-charcoal-800"
                            onClick={() => setSelectedContract({ contract, action: 'cancel' })}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-charcoal-100">
            <Pagination
              currentPage={data?.page || 1}
              totalPages={data?.totalPages || 1}
              totalCount={data?.totalCount || 0}
              pageSize={data?.pageSize || 10}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        isOpen={!!selectedContract}
        onClose={() => setSelectedContract(null)}
        title={
          selectedContract?.action === 'activate'
            ? 'Activate Rental Contract'
            : selectedContract?.action === 'terminate'
            ? 'Terminate Active Lease'
            : 'Cancel Rental Application'
        }
        description={
          selectedContract?.action === 'activate'
            ? `Approve contract #${selectedContract?.contract.id} for Unit ${selectedContract?.contract.unitNumber}? This marks the unit as Rented.`
            : selectedContract?.action === 'terminate'
            ? `Terminate contract #${selectedContract?.contract.id}? The unit will return to Available status immediately.`
            : `Cancel pending contract #${selectedContract?.contract.id}? The unit reservation will be released.`
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-charcoal-600">
            This state transition will be executed atomically on the server.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-charcoal-100">
            <Button
              variant="outline"
              onClick={() => setSelectedContract(null)}
              disabled={isPendingMutation}
            >
              Back
            </Button>
            <Button
              variant={selectedContract?.action === 'activate' ? 'primary' : 'destructive'}
              onClick={executeAction}
              isLoading={isPendingMutation}
            >
              Confirm Action
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
