import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  FileText,
  CreditCard,
  Wrench,
  User,
  LogOut,
  LayoutDashboard,
  Shield,
  Home,
  X,
} from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, primaryRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navLinks = [
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: LayoutDashboard,
      roles: ['Admin', 'Owner', 'Tenant'],
    },
    {
      label: primaryRole === 'Owner' ? 'My Properties' : 'Properties',
      to: primaryRole === 'Owner' ? '/properties?mine=true' : '/properties',
      icon: Building2,
      roles: ['Admin', 'Owner', 'Tenant'],
    },
    {
      label: 'Rental Contracts',
      to: '/contracts',
      icon: FileText,
      roles: ['Admin', 'Owner', 'Tenant'],
    },
    {
      label: 'Payments',
      to: '/payments',
      icon: CreditCard,
      roles: ['Admin', 'Owner', 'Tenant'],
    },
    {
      label: 'Maintenance',
      to: '/maintenance',
      icon: Wrench,
      roles: ['Admin', 'Owner', 'Tenant'],
    },
    {
      label: 'Profile & Settings',
      to: '/profile',
      icon: User,
      roles: ['Admin', 'Owner', 'Tenant'],
    },
  ];

  const visibleLinks = navLinks.filter(
    (link) => !primaryRole || link.roles.includes(primaryRole)
  );

  return (
    <aside className="flex h-full w-64 flex-col border-r border-charcoal-200 bg-white">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-charcoal-100">
        <NavLink to="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white shadow-xs">
            <Home className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-charcoal-900">Rentify</span>
            <span className="text-[10px] uppercase tracking-wider text-charcoal-400 font-semibold">
              Property Suite
            </span>
          </div>
        </NavLink>
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="md:hidden rounded-lg p-1 text-charcoal-400 hover:bg-charcoal-100"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* User Role Tag */}
      {user && (
        <div className="px-6 py-4 border-b border-charcoal-100 bg-charcoal-50/50">
          <div className="flex items-center justify-between">
            <div className="flex flex-col truncate pr-2">
              <span className="text-xs font-semibold text-charcoal-900 truncate">{user.email}</span>
              <span className="text-[11px] text-charcoal-500 capitalize">{primaryRole || 'Member'}</span>
            </div>
            <Badge variant="brand" className="text-[10px] font-bold uppercase shrink-0">
              {primaryRole === 'Admin' ? <Shield className="w-3 h-3 mr-0.5" /> : null}
              {primaryRole || 'User'}
            </Badge>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {visibleLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-charcoal-600 hover:bg-charcoal-100 hover:text-charcoal-900'
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout Footer */}
      <div className="p-3 border-t border-charcoal-100">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
