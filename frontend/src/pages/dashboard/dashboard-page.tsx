import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Building2,
  FileText,
  Key,
  Clock,
  ArrowRight,
  PlusCircle,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { propertiesService } from '@/services/properties.service';
import { contractsService } from '@/services/contracts.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { TenantDashboard } from './tenant-dashboard';

export const DashboardPage: React.FC = () => {
  const { user, primaryRole } = useAuth();

  // If user is a Tenant, render the dedicated consumer-facing TenantDashboard
  if (primaryRole === 'Tenant') {
    return <TenantDashboard />;
  }

  // Fetch properties (Owner gets mine=true, others get public/all)
  const isOwner = primaryRole === 'Owner';

  const { data: propertiesData, isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties', { mine: isOwner, pageSize: 20 }],
    queryFn: () => propertiesService.getProperties({ mine: isOwner, pageSize: 20 }),
  });

  // Fetch contracts
  const { data: contractsData, isLoading: isLoadingContracts } = useQuery({
    queryKey: ['contracts', { pageSize: 10 }],
    queryFn: () => contractsService.getContracts({ pageSize: 10 }),
    enabled: !!user,
  });

  const contracts = contractsData?.items || [];

  const totalProperties = propertiesData?.totalCount ?? 0;
  const totalContracts = contractsData?.totalCount ?? 0;
  const activeContracts = contracts.filter((c) => c.status === 'Active').length;
  const pendingContracts = contracts.filter((c) => c.status === 'Pending').length;

  // Chart data compiled strictly from real returned contracts
  const contractStatusDistribution = [
    { name: 'Active', count: contracts.filter((c) => c.status === 'Active').length },
    { name: 'Pending', count: contracts.filter((c) => c.status === 'Pending').length },
    { name: 'Terminated', count: contracts.filter((c) => c.status === 'Terminated').length },
    { name: 'Cancelled', count: contracts.filter((c) => c.status === 'Cancelled').length },
  ].filter((item) => item.count > 0);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-brand-900 to-charcoal-900 p-6 sm:p-8 text-white shadow-sm">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-800/80 px-3 py-1 text-xs font-semibold text-brand-200 mb-3 border border-brand-700/60">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Role: {primaryRole}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome back, {user?.email.split('@')[0]}
          </h1>
          <p className="mt-2 text-sm text-charcoal-300">
            {isOwner
              ? 'Manage your properties, monitor tenant applications, and review lease contracts.'
              : 'System Administrator overview: monitor properties, contracts, and platform health.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {isOwner && (
              <Link to="/properties/create">
                <Button variant="primary" size="sm" className="bg-brand-500 hover:bg-brand-600 text-white">
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Add Property
                </Button>
              </Link>
            )}
            <Link to="/properties">
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <Search className="w-4 h-4 mr-1.5" />
                Browse Catalog
              </Button>
            </Link>
            <Link to="/contracts">
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                <FileText className="w-4 h-4 mr-1.5" />
                View Contracts
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                  {isOwner ? 'My Properties' : 'Properties'}
                </p>
                <div className="mt-1 text-2xl font-bold text-charcoal-900">
                  {isLoadingProperties ? <Skeleton className="h-8 w-16" /> : totalProperties}
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-xs text-charcoal-500 flex items-center justify-between">
              <span>{isOwner ? 'Under management' : 'Total listed'}</span>
              <Link to="/properties" className="text-brand-600 font-semibold hover:underline">
                View all →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                  Total Contracts
                </p>
                <div className="mt-1 text-2xl font-bold text-charcoal-900">
                  {isLoadingContracts ? <Skeleton className="h-8 w-16" /> : totalContracts}
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-xs text-charcoal-500 flex items-center justify-between">
              <span>All recorded leases</span>
              <Link to="/contracts" className="text-brand-600 font-semibold hover:underline">
                View all →
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                  Active Leases
                </p>
                <div className="mt-1 text-2xl font-bold text-charcoal-900">
                  {isLoadingContracts ? <Skeleton className="h-8 w-16" /> : activeContracts}
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Key className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-xs text-emerald-700 font-medium">Currently active</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-500">
                  Pending Actions
                </p>
                <div className="mt-1 text-2xl font-bold text-charcoal-900">
                  {isLoadingContracts ? <Skeleton className="h-8 w-16" /> : pendingContracts}
                </div>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3 text-xs text-amber-700 font-medium">
              {pendingContracts > 0 ? 'Requires attention' : 'All up to date'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Contracts & Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Contracts Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Recent Rental Contracts</CardTitle>
                <p className="text-xs text-charcoal-500 mt-1">
                  Latest rental requests and active agreements
                </p>
              </div>
              <Link to="/contracts">
                <Button variant="ghost" size="sm" className="text-brand-600">
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {isLoadingContracts ? (
                <div className="p-6 space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : contracts.length === 0 ? (
                <div className="p-8 text-center text-xs text-charcoal-500">
                  No contracts created yet. Browse properties and apply for a unit to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-charcoal-50 border-b border-charcoal-200 text-charcoal-500 font-semibold uppercase">
                      <tr>
                        <th className="px-5 py-3">Property / Unit</th>
                        <th className="px-5 py-3">Term</th>
                        <th className="px-5 py-3">Monthly Rent</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-charcoal-100 text-charcoal-700">
                      {contracts.slice(0, 5).map((contract) => (
                        <tr key={contract.id} className="hover:bg-charcoal-50/60 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-charcoal-900">{contract.propertyName}</p>
                            <p className="text-charcoal-500">Unit: {contract.unitNumber}</p>
                          </td>
                          <td className="px-5 py-3.5 text-charcoal-600">
                            {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-charcoal-900">
                            {formatCurrency(contract.monthlyRent)}
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusBadge status={contract.status || ''} type="contract" />
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <Link
                              to={`/contracts/${contract.id}`}
                              className="text-brand-600 font-semibold hover:text-brand-800"
                            >
                              Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Real Chart Widget */}
        <div className="lg:col-span-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>Contract Distribution</CardTitle>
              <p className="text-xs text-charcoal-500">Breakdown of contracts by status</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center p-4">
              {isLoadingContracts ? (
                <Skeleton className="h-48 w-full" />
              ) : contractStatusDistribution.length === 0 ? (
                <div className="text-center py-12 text-xs text-charcoal-400">
                  No contract data available to plot yet.
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contractStatusDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
