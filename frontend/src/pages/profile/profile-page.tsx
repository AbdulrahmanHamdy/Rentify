import React from 'react';
import { useAuth } from '@/features/auth/use-auth';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, ShieldCheck, Mail, Key, LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, primaryRole, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Profile & Settings"
        description="Manage your user identity, active session security, and role permissions"
      />

      {/* Account Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-brand-600 mb-1">
            <User className="w-5 h-5" />
            <CardTitle>Account Details</CardTitle>
          </div>
          <CardDescription>Your registered identity on the Rentify platform</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-charcoal-50 border border-charcoal-100 gap-2">
            <div>
              <span className="text-xs text-charcoal-500 block">Email Address</span>
              <span className="text-sm font-bold text-charcoal-900">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success">
                <Mail className="w-3 h-3 mr-1" />
                Verified
              </Badge>
              <Badge variant="brand">
                <ShieldCheck className="w-3 h-3 mr-1" />
                {primaryRole}
              </Badge>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-charcoal-50 border border-charcoal-100 text-xs text-charcoal-600 space-y-1">
            <span className="text-charcoal-500 block uppercase font-semibold text-[10px]">User Identifier</span>
            <code className="text-charcoal-800 break-all">{user?.userId}</code>
          </div>
        </CardContent>
      </Card>

      {/* Security & Password */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-brand-600 mb-1">
            <Key className="w-5 h-5" />
            <CardTitle>Security & Password</CardTitle>
          </div>
          <CardDescription>Keep your account secure with short-lived tokens and strong credentials</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-charcoal-600 leading-relaxed">
            Rentify uses stateless JWT access tokens kept strictly in browser memory. Tokens are never persisted to localStorage or sessionStorage to mitigate cross-site scripting (XSS) risks.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Link to="/forgot-password">
              <Button variant="outline" size="sm">
                Request Password Reset Link
              </Button>
            </Link>

            <Button variant="destructive" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign Out of Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
