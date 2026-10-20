import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/use-auth';
import { profileService } from '@/services/profile.service';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorAlert } from '@/components/shared/error-alert';
import {
  User,
  ShieldCheck,
  Mail,
  Key,
  LogOut,
  Building,
  Home,
  Briefcase,
  Calendar,
  CheckCircle2,
  Lock,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, primaryRole, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');

  // Personal details form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);

  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);

  // Fetch profile
  const {
    data: profile,
    isLoading,
    error: fetchError,
  } = useQuery({
    queryKey: ['profile'],
    queryFn: profileService.getProfile,
    staleTime: 60 * 1000,
  });

  // Populate form fields when profile is fetched
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setPhoneNumber(profile.phoneNumber || '');
      setCompanyName(profile.companyName || '');
      setNationalId(profile.nationalId || '');
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile'], updated);
      setProfileSuccessMsg('Profile updated successfully!');
      setTimeout(() => setProfileSuccessMsg(null), 4000);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: profileService.changePassword,
    onSuccess: () => {
      setPasswordSuccessMsg('Your password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError(null);
      setTimeout(() => setPasswordSuccessMsg(null), 5000);
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccessMsg(null);
    updateProfileMutation.mutate({
      firstName,
      lastName,
      phoneNumber,
      companyName: profile?.roles.includes('Owner') ? companyName : undefined,
      nationalId: profile?.roles.includes('Tenant') ? nationalId : undefined,
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccessMsg(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Derive initials
  const initials = (() => {
    const f = profile?.firstName?.trim();
    const l = profile?.lastName?.trim();
    if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
    if (f) return f[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return 'U';
  })();

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Rentify User';

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    : 'Recent Member';

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader title="Profile & Settings" description="Loading your profile information..." />
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-20 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader
        title="Profile & Settings"
        description="Manage your account profile, role configuration, and password security."
      />

      {fetchError && <ErrorAlert error={fetchError} />}

      {/* Hero Profile Banner */}
      <Card className="overflow-hidden border-charcoal-200 shadow-sm">
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 px-6 py-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl text-2xl font-bold tracking-tight">
                {initials}
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 ring-4 ring-brand-700">
                  <BadgeCheck className="h-4 w-4 text-brand-950" />
                </span>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-white tracking-tight">{fullName}</h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-brand-100">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {profile?.email || user?.email}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    Joined {memberSince}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex sm:flex-col items-start sm:items-end gap-2">
              <Badge variant="brand" className="bg-white/20 hover:bg-white/30 text-white border-white/20 backdrop-blur-sm text-xs font-semibold px-3 py-1">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-brand-200" />
                {primaryRole || 'User'}
              </Badge>
              <Badge variant="success" className="bg-emerald-400/20 text-emerald-100 border-emerald-400/30 text-xs px-2.5 py-0.5">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active Account
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick Highlights Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-charcoal-100 bg-charcoal-50/60 border-t border-charcoal-100 text-center">
          {profile?.roles.includes('Owner') ? (
            <>
              <div className="p-4">
                <span className="text-xs uppercase font-medium text-charcoal-500 block mb-0.5">Properties</span>
                <span className="text-lg font-bold text-charcoal-900 flex items-center justify-center gap-1.5">
                  <Building className="w-4 h-4 text-brand-600" />
                  {profile.propertiesCount}
                </span>
              </div>
              <div className="p-4">
                <span className="text-xs uppercase font-medium text-charcoal-500 block mb-0.5">Total Units</span>
                <span className="text-lg font-bold text-charcoal-900 flex items-center justify-center gap-1.5">
                  <Home className="w-4 h-4 text-brand-600" />
                  {profile.unitsCount}
                </span>
              </div>
              <div className="p-4 col-span-2 sm:col-span-1 border-t sm:border-t-0 border-charcoal-100">
                <span className="text-xs uppercase font-medium text-charcoal-500 block mb-0.5">Company</span>
                <span className="text-sm font-semibold text-charcoal-800 truncate block px-2">
                  {profile.companyName || 'Individual Owner'}
                </span>
              </div>
            </>
          ) : profile?.roles.includes('Tenant') ? (
            <>
              <div className="p-4">
                <span className="text-xs uppercase font-medium text-charcoal-500 block mb-0.5">Active Contracts</span>
                <span className="text-lg font-bold text-charcoal-900 flex items-center justify-center gap-1.5">
                  <FileText className="w-4 h-4 text-brand-600" />
                  {profile.activeContractsCount}
                </span>
              </div>
              <div className="p-4">
                <span className="text-xs uppercase font-medium text-charcoal-500 block mb-0.5">National ID</span>
                <span className="text-sm font-semibold text-charcoal-800">
                  {profile.nationalId ? 'Registered' : 'Not Set'}
                </span>
              </div>
              <div className="p-4 col-span-2 sm:col-span-1 border-t sm:border-t-0 border-charcoal-100">
                <span className="text-xs uppercase font-medium text-charcoal-500 block mb-0.5">Lease Status</span>
                <span className="text-sm font-semibold text-emerald-600">
                  In Good Standing
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="p-4">
                <span className="text-xs uppercase font-medium text-charcoal-500 block mb-0.5">System Access</span>
                <span className="text-sm font-bold text-charcoal-900">Administrator</span>
              </div>
              <div className="p-4">
                <span className="text-xs uppercase font-medium text-charcoal-500 block mb-0.5">Privileges</span>
                <span className="text-sm font-semibold text-brand-600">Full Access</span>
              </div>
              <div className="p-4 col-span-2 sm:col-span-1 border-t sm:border-t-0 border-charcoal-100">
                <span className="text-xs uppercase font-medium text-charcoal-500 block mb-0.5">Security Level</span>
                <span className="text-sm font-semibold text-emerald-600">Elevated</span>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* Tabs Switcher */}
      <div className="flex border-b border-charcoal-200 space-x-2">
        <button
          onClick={() => setActiveTab('details')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-700 hover:border-charcoal-300'
          }`}
        >
          <User className="w-4 h-4" />
          Personal Details
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-brand-600 text-brand-600'
              : 'border-transparent text-charcoal-500 hover:text-charcoal-700 hover:border-charcoal-300'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security & Password
        </button>
      </div>

      {/* Tab 1: Personal Details */}
      {activeTab === 'details' && (
        <Card className="border-charcoal-200">
          <CardHeader>
            <div className="flex items-center gap-2 text-brand-600 mb-1">
              <User className="w-5 h-5" />
              <CardTitle>Personal Information</CardTitle>
            </div>
            <CardDescription>
              Update your personal identity details across the Rentify ecosystem.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {profileSuccessMsg && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                {profileSuccessMsg}
              </div>
            )}

            {updateProfileMutation.error && (
              <div className="mb-4">
                <ErrorAlert error={updateProfileMutation.error} />
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  placeholder="e.g. Ahmed"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <Input
                  label="Last Name"
                  placeholder="e.g. Hassan"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  type="email"
                  value={profile?.email || user?.email || ''}
                  disabled
                  helperText="Email cannot be changed directly as it acts as your primary system identifier."
                />

                <Input
                  label="Phone Number"
                  placeholder="e.g. +20 100 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  helperText="Used for SMS alerts and rental contract contact details."
                />
              </div>

              {profile?.roles.includes('Owner') && (
                <div className="pt-2 border-t border-charcoal-100">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-600 mb-3 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-brand-600" />
                    Property Owner Profile
                  </h4>
                  <Input
                    label="Company or Trade Name"
                    placeholder="e.g. Nile Property Investments Ltd."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    helperText="Displayed to tenants on contracts and receipts if provided."
                  />
                </div>
              )}

              {profile?.roles.includes('Tenant') && (
                <div className="pt-2 border-t border-charcoal-100">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-charcoal-600 mb-3 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-brand-600" />
                    Tenant Identity
                  </h4>
                  <Input
                    label="National ID / Passport Number"
                    placeholder="e.g. 29510101234567"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    helperText="Required for legally binding Egyptian lease agreements."
                  />
                </div>
              )}

              <div className="pt-4 flex items-center justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={updateProfileMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card className="border-charcoal-200">
            <CardHeader>
              <div className="flex items-center gap-2 text-brand-600 mb-1">
                <Key className="w-5 h-5" />
                <CardTitle>Change Password</CardTitle>
              </div>
              <CardDescription>
                Ensure your Rentify account is using a long, random password to stay secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {passwordSuccessMsg && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  {passwordSuccessMsg}
                </div>
              )}

              {passwordError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 font-medium">
                  {passwordError}
                </div>
              )}

              {changePasswordMutation.error && (
                <div className="mb-4">
                  <ErrorAlert error={changePasswordMutation.error} />
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <Input
                  label="Current Password"
                  type="password"
                  required
                  placeholder="Enter current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />

                <Input
                  label="New Password"
                  type="password"
                  required
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  helperText="Must be at least 8 characters long."
                />

                <Input
                  label="Confirm New Password"
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={changePasswordMutation.isPending}
                  >
                    Update Password
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Session & Security Info */}
          <Card className="border-charcoal-200">
            <CardHeader>
              <div className="flex items-center gap-2 text-charcoal-700 mb-1">
                <ShieldCheck className="w-5 h-5 text-brand-600" />
                <CardTitle>Session Security</CardTitle>
              </div>
              <CardDescription>
                Details on your current authenticated session and token lifecycle
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-charcoal-50 border border-charcoal-100 text-xs text-charcoal-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-charcoal-700">Storage Protection</span>
                  <Badge variant="success" className="text-[10px]">In-Memory Only</Badge>
                </div>
                <p className="text-charcoal-500 leading-relaxed">
                  Rentify holds short-lived JWT access tokens strictly in browser memory. Tokens are never written to localStorage or cookies, eliminating token theft via Cross-Site Scripting (XSS).
                </p>
                <div className="pt-2 border-t border-charcoal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-charcoal-500 font-mono text-[11px] truncate">
                    User ID: {profile?.userId || user?.userId}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="destructive" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1.5" />
                  Sign Out of Session
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
