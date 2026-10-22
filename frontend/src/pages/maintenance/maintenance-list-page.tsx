import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Wrench,
  Plus,
  Home,
  User,
  Filter,
  MessageSquare,
} from 'lucide-react';
import { maintenanceService } from '@/services/maintenance.service';
import { contractsService } from '@/services/contracts.service';
import { useAuth } from '@/features/auth/use-auth';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/shared/error-alert';
import { EmptyState } from '@/components/shared/empty-state';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/lib/utils';
import { queryClient } from '@/lib/query-client';
import type { MaintenanceRequestDto } from '@/types';

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Low', color: 'bg-charcoal-100 text-charcoal-700 border-charcoal-300' },
  2: { label: 'Medium', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  3: { label: 'High', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  4: { label: 'Emergency', color: 'bg-red-50 text-red-700 border-red-300 font-bold' },
};

const STATUS_LABELS: Record<number, { label: string; badgeVariant: 'warning' | 'brand' | 'success' | 'neutral' }> = {
  1: { label: 'Open', badgeVariant: 'warning' },
  2: { label: 'In Progress', badgeVariant: 'brand' },
  3: { label: 'Resolved', badgeVariant: 'success' },
  4: { label: 'Cancelled', badgeVariant: 'neutral' },
};

export const MaintenanceListPage: React.FC = () => {
  const { primaryRole } = useAuth();
  const toast = useToast();

  const isTenant = primaryRole === 'Tenant';
  const isOwnerOrAdmin = primaryRole === 'Owner' || primaryRole === 'Admin';

  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [ticketToUpdate, setTicketToUpdate] = useState<MaintenanceRequestDto | null>(null);

  // Form states for creating request
  const [selectedUnitId, setSelectedUnitId] = useState<number | ''>('');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState<number>(2);
  const [createError, setCreateError] = useState<unknown>(null);

  // Form states for updating status
  const [newStatus, setNewStatus] = useState<number>(2);
  const [statusNote, setStatusNote] = useState('');
  const [updateError, setUpdateError] = useState<unknown>(null);

  // Fetch maintenance tickets
  const { data, isLoading, error } = useQuery({
    queryKey: ['maintenance', { status: statusFilter }],
    queryFn: () => maintenanceService.getRequests({ status: statusFilter, pageSize: 50 }),
  });

  // Fetch active contracts for tenant so they can select their leased unit
  const { data: contractsData } = useQuery({
    queryKey: ['my-contracts-for-maintenance'],
    queryFn: () => contractsService.getContracts({ pageSize: 20 }),
    enabled: isTenant,
  });

  const tenantUnits = contractsData?.items || [];

  // Create request mutation
  const createRequestMutation = useMutation({
    mutationFn: () =>
      maintenanceService.createRequest({
        unitId: Number(selectedUnitId),
        title: ticketTitle.trim(),
        description: ticketDescription.trim(),
        priority: ticketPriority,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setIsCreateModalOpen(false);
      setTicketTitle('');
      setTicketDescription('');
      setSelectedUnitId('');
      toast.success('Maintenance ticket submitted! The property manager has been notified.');
    },
    onError: (err) => {
      setCreateError(err);
      toast.error('Failed to submit maintenance request.');
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: () => {
      if (!ticketToUpdate) throw new Error('No ticket selected');
      return maintenanceService.updateStatus(ticketToUpdate.id, {
        status: newStatus,
        note: statusNote.trim() || undefined,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setTicketToUpdate(null);
      setStatusNote('');
      toast.success('Maintenance status updated.');
    },
    onError: (err) => {
      setUpdateError(err);
      toast.error('Failed to update status.');
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!selectedUnitId) return;
    createRequestMutation.mutate();
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError(null);
    updateStatusMutation.mutate();
  };

  const requests = data?.items || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance & Repairs"
        description={
          isTenant
            ? 'Report residential unit issues, request repairs, and track technician updates.'
            : 'Triage reported property maintenance requests, assign repairs, and log resolutions.'
        }
        action={
          isTenant ? (
            <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="w-4 h-4 mr-1.5" />
              File New Request
            </Button>
          ) : undefined
        }
      />

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-charcoal-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-brand-600" />
            Status:
          </span>

          <button
            onClick={() => setStatusFilter(undefined)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === undefined
                ? 'bg-brand-600 text-white shadow-xs font-semibold'
                : 'bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200'
            }`}
          >
            All Requests ({requests.length})
          </button>

          <button
            onClick={() => setStatusFilter(1)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 1
                ? 'bg-amber-500 text-white shadow-xs font-semibold'
                : 'bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200'
            }`}
          >
            Open
          </button>

          <button
            onClick={() => setStatusFilter(2)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 2
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200'
            }`}
          >
            In Progress
          </button>

          <button
            onClick={() => setStatusFilter(3)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === 3
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      <ErrorAlert error={error} />

      {/* Ticket Cards Grid */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={statusFilter ? 'No requests match this status' : 'No maintenance requests filed'}
          description={
            isTenant
              ? 'Everything in your leased unit looks operational! If any repair is needed, click "File New Request" above.'
              : 'There are currently no active maintenance issues reported across your properties.'
          }
          action={
            isTenant ? (
              <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" />
                Submit First Request
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const prio = PRIORITY_LABELS[req.priority] || { label: 'Normal', color: 'bg-charcoal-100' };
            const stat = STATUS_LABELS[req.status] || { label: 'Open', badgeVariant: 'warning' };

            return (
              <Card key={req.id} className="border-charcoal-200 hover:border-charcoal-300 transition-shadow">
                <CardContent className="p-5 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${prio.color}`}>
                          {prio.label} Priority
                        </span>
                        <Badge variant={stat.badgeVariant}>
                          {stat.label}
                        </Badge>
                        <span className="text-xs text-charcoal-400">
                          Filed on {formatDate(req.createdAt)}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-charcoal-900 pt-1">{req.title}</h3>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-600 pt-0.5">
                        <span className="flex items-center gap-1 font-semibold text-charcoal-800">
                          <Home className="w-3.5 h-3.5 text-brand-600" />
                          Unit {req.unitNumber} • {req.propertyName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-charcoal-400" />
                          Tenant: {req.tenantName}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {isOwnerOrAdmin && req.status !== 3 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTicketToUpdate(req);
                            setNewStatus(req.status === 1 ? 2 : 3);
                          }}
                        >
                          <Wrench className="w-3.5 h-3.5 mr-1 text-brand-600" />
                          Update Status
                        </Button>
                      )}

                      {isTenant && req.status === 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setTicketToUpdate(req);
                            setNewStatus(4);
                          }}
                          className="text-charcoal-500 hover:text-red-600 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-charcoal-700 bg-charcoal-50/70 p-3.5 rounded-xl border border-charcoal-100 leading-relaxed">
                    {req.description}
                  </p>

                  {/* Updates & History Log */}
                  {req.updates && req.updates.length > 0 && (
                    <div className="pt-2 border-t border-charcoal-100 space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-charcoal-400 block">
                        Activity & Status History:
                      </span>
                      <div className="space-y-1.5">
                        {req.updates.map((u) => (
                          <div
                            key={u.id}
                            className="text-xs flex items-start gap-2 bg-charcoal-50/40 p-2 rounded-lg border border-charcoal-100 text-charcoal-600"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-brand-600 shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <span className="font-semibold text-charcoal-800">
                                Status moved to {STATUS_LABELS[u.newStatus]?.label || 'Updated'}
                              </span>
                              {u.note && <span className="text-charcoal-700"> — "{u.note}"</span>}
                              <span className="text-charcoal-400 ml-2 text-[10px]">
                                {formatDate(u.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* File Maintenance Request Modal */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="File a Maintenance Request"
        description="Submit an urgent or routine repair request directly to your landlord."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 mt-3">
          <ErrorAlert error={createError} />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Select Leased Unit *
            </label>
            <select
              required
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(Number(e.target.value))}
              className="w-full rounded-lg border border-charcoal-300 bg-white px-3.5 py-2 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Select your leased unit...</option>
              {tenantUnits.map((c) => (
                <option key={c.id} value={c.unitId}>
                  Unit {c.unitNumber} ({c.propertyName}) — {c.status}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Issue Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Master bathroom faucet dripping"
              value={ticketTitle}
              onChange={(e) => setTicketTitle(e.target.value)}
              className="w-full rounded-lg border border-charcoal-300 bg-white px-3.5 py-2 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Urgency Level
            </label>
            <select
              value={ticketPriority}
              onChange={(e) => setTicketPriority(Number(e.target.value))}
              className="w-full rounded-lg border border-charcoal-300 bg-white px-3.5 py-2 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value={1}>Low — Minor cosmetic or non-blocking</option>
              <option value={2}>Medium — Standard repair</option>
              <option value={3}>High — Significant disruption</option>
              <option value={4}>Emergency — Water leak, electrical hazard, AC failure</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Detailed Description *
            </label>
            <textarea
              required
              rows={4}
              placeholder="Please provide details about the location of the problem, when it started, and any symptoms..."
              value={ticketDescription}
              onChange={(e) => setTicketDescription(e.target.value)}
              className="w-full rounded-lg border border-charcoal-300 bg-white px-3.5 py-2 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-charcoal-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={createRequestMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={createRequestMutation.isPending}
            >
              Submit Ticket
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Update Status Modal */}
      <Dialog
        isOpen={!!ticketToUpdate}
        onClose={() => setTicketToUpdate(null)}
        title={`Update Request #${ticketToUpdate?.id}`}
        description="Update the progress status of this maintenance ticket and optionally leave a note for the tenant."
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4 mt-3">
          <ErrorAlert error={updateError} />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Change Status To:
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(Number(e.target.value))}
              className="w-full rounded-lg border border-charcoal-300 bg-white px-3.5 py-2 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value={1}>Open</option>
              <option value={2}>In Progress — Technician Dispatched</option>
              <option value={3}>Resolved — Work Completed</option>
              <option value={4}>Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Technician / Action Note (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Plumber scheduled for tomorrow at 2 PM"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
              className="w-full rounded-lg border border-charcoal-300 bg-white px-3.5 py-2 text-sm text-charcoal-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-charcoal-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setTicketToUpdate(null)}
              disabled={updateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={updateStatusMutation.isPending}
            >
              Save Update
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
