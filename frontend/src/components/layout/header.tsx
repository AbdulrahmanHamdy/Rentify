import React from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { useNavigate } from 'react-router-dom';

export interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu }) => {
  const { user, primaryRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-charcoal-200 bg-white/95 px-4 sm:px-6 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="md:hidden rounded-lg p-2 text-charcoal-600 hover:bg-charcoal-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          aria-label="Open mobile menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-sm font-semibold text-charcoal-700 hidden sm:inline-block">
          Rentify Management Console
        </span>
      </div>

      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-charcoal-900">{user.email}</span>
              <span className="text-[11px] text-charcoal-500 capitalize">{primaryRole}</span>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-700 border border-brand-200 font-semibold text-xs">
              <User className="w-4 h-4" />
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-charcoal-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 px-3 py-1.5"
            >
              Log in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 px-3 py-1.5 rounded-lg"
            >
              Register
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
