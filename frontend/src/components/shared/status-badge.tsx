import React from 'react';
import { Badge } from '@/components/ui/badge';

export interface StatusBadgeProps {
  status: string;
  type?: 'unit' | 'contract' | 'payment';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'contract' }) => {
  const normalized = status.toLowerCase();

  let variant: 'brand' | 'success' | 'warning' | 'danger' | 'neutral' = 'neutral';
  let label = status;

  if (type === 'unit') {
    switch (normalized) {
      case 'available':
        variant = 'success';
        label = 'Available';
        break;
      case 'reserved':
        variant = 'warning';
        label = 'Reserved';
        break;
      case 'rented':
        variant = 'brand';
        label = 'Rented';
        break;
      case 'maintenance':
        variant = 'danger';
        label = 'Maintenance';
        break;
    }
  } else if (type === 'contract') {
    switch (normalized) {
      case 'pending':
        variant = 'warning';
        label = 'Pending Approval';
        break;
      case 'active':
        variant = 'success';
        label = 'Active';
        break;
      case 'expired':
        variant = 'neutral';
        label = 'Expired';
        break;
      case 'cancelled':
        variant = 'neutral';
        label = 'Cancelled';
        break;
      case 'terminated':
        variant = 'danger';
        label = 'Terminated';
        break;
    }
  } else if (type === 'payment') {
    switch (normalized) {
      case 'paid':
        variant = 'success';
        label = 'Paid';
        break;
      case 'pending':
        variant = 'warning';
        label = 'Pending';
        break;
      case 'late':
        variant = 'danger';
        label = 'Late';
        break;
      case 'cancelled':
        variant = 'neutral';
        label = 'Cancelled';
        break;
    }
  }

  return <Badge variant={variant}>{label}</Badge>;
};
