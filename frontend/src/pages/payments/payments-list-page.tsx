import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CreditCard, AlertCircle, ExternalLink } from 'lucide-react';
import { contractsService } from '@/services/contracts.service';
import { useAuth } from '@/features/auth/use-auth';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, formatDate } from '@/lib/utils';

export const PaymentsListPage: React.FC = () => {
  const { user } = useAuth();

  // Fetch user's contracts to display real scheduled rental dues
  const { data: contractsData, isLoading } = useQuery({
    queryKey: ['contracts', { pageSize: 50 }],
    queryFn: () => contractsService.getContracts({ pageSize: 50 }),
    enabled: !!user,
  });

  const contracts = contractsData?.items || [];
  const activeContracts = contracts.filter((c) => c.status === 'Active');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Installments"
        description="Monitor scheduled rental fees, security deposits, and transaction records"
      />

      {/* Gateway Integration Status Banner */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-5 text-amber-900">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm text-amber-950">
              Payment Gateway Integration Notice
            </h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Automated online card processing via Paymob is defined in the backend architecture and scheduled for activation in Phase 8. In the current release, all rent obligations, monthly rental rates, and security deposits are legally tracked through active rental contracts.
            </p>
          </div>
        </div>
      </div>

      {/* Contract Financial Summaries */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-charcoal-900">Active Lease Obligations</h2>
          <p className="text-xs text-charcoal-500">
            Current financial terms derived from validated rental contracts
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
        ) : activeContracts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-xs text-charcoal-500 space-y-3">
              <CreditCard className="w-10 h-10 mx-auto text-charcoal-300 stroke-[1.5]" />
              <p>No active rental contracts with ongoing payment schedules found.</p>
              <Link to="/contracts">
                <Button variant="outline" size="sm">
                  View All Contracts
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeContracts.map((contract) => (
              <Card key={contract.id} className="border-charcoal-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{contract.propertyName}</CardTitle>
                      <CardDescription>Unit {contract.unitNumber}</CardDescription>
                    </div>
                    <StatusBadge status={contract.status || ''} type="contract" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-charcoal-50 border border-charcoal-100 text-xs">
                    <div>
                      <span className="text-charcoal-500 block">Monthly Rate</span>
                      <span className="text-sm font-bold text-brand-700">
                        {formatCurrency(contract.monthlyRent)}
                      </span>
                    </div>
                    <div>
                      <span className="text-charcoal-500 block">Held Deposit</span>
                      <span className="text-sm font-semibold text-charcoal-900">
                        {formatCurrency(contract.securityDeposit)}
                      </span>
                    </div>
                    <div className="col-span-2 pt-2 border-t border-charcoal-200/60 flex items-center justify-between">
                      <span className="text-charcoal-500">Term Period:</span>
                      <span className="font-medium text-charcoal-800">
                        {formatDate(contract.startDate)} — {formatDate(contract.endDate)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-charcoal-400">
                      Contract #{contract.id}
                    </span>
                    <Link to={`/contracts/${contract.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs text-brand-600 hover:text-brand-800">
                        <span>Contract Details</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
