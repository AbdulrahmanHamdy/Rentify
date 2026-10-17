import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Key,
  CreditCard,
  Wrench,
  User,
  LogOut,
  Building2,
} from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { cn } from '@/lib/utils';

export const TenantLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Home', to: '/dashboard', icon: Home, exact: true },
    { label: 'Browse', to: '/properties', icon: Search },
    { label: 'My Lease', to: '/contracts', icon: Key },
    { label: 'Payments', to: '/payments', icon: CreditCard },
    { label: 'Maintenance', to: '/maintenance', icon: Wrench },
    { label: 'Profile', to: '/profile', icon: User },
  ];

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : 'T';
  const username = user?.email ? user.email.split('@')[0] : 'Renter';

  return (
    <div className="min-h-screen bg-[#faf8f5] text-charcoal-900 flex flex-col font-sans selection:bg-teal-100 selection:text-teal-900">
      {/* ── Top Navigation Bar (Desktop & Tablet) ── */}
      <header className="sticky top-0 z-40 w-full border-b border-amber-200/50 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <NavLink to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition-transform">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-charcoal-900">
                  Rent<span className="text-teal-600">ify</span>
                </span>
                <span className="hidden sm:inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200/60">
                  Tenant Portal
                </span>
              </div>
            </NavLink>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to, item.exact);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150',
                      active
                        ? 'bg-teal-50 text-teal-800 font-semibold shadow-xs'
                        : 'text-charcoal-600 hover:text-charcoal-900 hover:bg-amber-50/60'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        active ? 'text-teal-600' : 'text-charcoal-400 group-hover:text-charcoal-600'
                      )}
                    />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Right: User Menu & Logout */}
            <div className="flex items-center gap-3">
              <NavLink
                to="/profile"
                className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-amber-50/80 transition-colors"
                title="View Profile"
              >
                <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-gradient-to-tr from-teal-600 to-teal-500 text-white text-xs font-bold shadow-xs">
                  {userInitial}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-charcoal-800 truncate max-w-[120px]">
                    {username}
                  </span>
                  <span className="text-[10px] text-teal-700 font-medium">Tenant</span>
                </div>
              </NavLink>

              <button
                onClick={handleLogout}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-charcoal-400 hover:text-rose-600 hover:bg-rose-50 transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12">
        <Outlet />
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-amber-200/60 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] px-2 py-1.5"
        aria-label="Mobile Bottom Navigation"
      >
        <div className="grid grid-cols-6 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, item.exact);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-center transition-colors',
                  active ? 'text-teal-700 font-bold' : 'text-charcoal-400 hover:text-charcoal-700'
                )}
              >
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-lg transition-transform',
                    active ? 'bg-teal-50 text-teal-600 scale-105' : 'text-charcoal-500'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
