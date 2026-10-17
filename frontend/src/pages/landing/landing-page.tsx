import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  Building2,
  Users,
  ShieldCheck,
  FileText,
  CreditCard,
  Wrench,
  BarChart3,
  ArrowRight,
  CheckCircle,
  LogIn,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { Button } from '@/components/ui/button';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-charcoal-50 text-charcoal-900 flex flex-col selection:bg-brand-100 selection:text-brand-900">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 w-full border-b border-charcoal-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/20 group-hover:bg-brand-700 transition-colors">
              <Home className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-charcoal-900">
                Rent<span className="text-brand-600">ify</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-charcoal-600">
            <a href="#features" className="hover:text-brand-600 transition-colors">
              Features
            </a>
            <a href="#solutions" className="hover:text-brand-600 transition-colors">
              Solutions
            </a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">
              How It Works
            </a>
            <a href="#preview" className="hover:text-brand-600 transition-colors">
              Overview
            </a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm" className="gap-2">
                  <span>Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="hidden sm:inline-flex gap-1.5">
                    <LogIn className="w-4 h-4" />
                    <span>Sign In</span>
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" className="gap-1.5 shadow-sm">
                    <span>Get Started</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28 bg-gradient-to-b from-white via-brand-50/30 to-charcoal-50">
        <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.07] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-semibold mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Modern Property & Rental Management</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-charcoal-900 leading-[1.15]">
              Manage Properties with Ease.{' '}
              <span className="text-brand-600 block sm:inline">Rent with Total Peace of Mind.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-charcoal-600 leading-relaxed max-w-2xl mx-auto">
              A comprehensive platform uniting property owners and tenants. From listing units and signing digital contracts to tracking monthly rent payments and handling maintenance requests in Egyptian Pounds (EGP).
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              {isAuthenticated ? (
                <Link to="/dashboard" className="w-full sm:w-auto">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-brand-600/20">
                    <span>Welcome back, {user?.email.split('@')[0]} — Open Dashboard</span>
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register" className="w-full sm:w-auto">
                    <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2 shadow-lg shadow-brand-600/20 text-base">
                      <span>Create Free Account</span>
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>
                  <Link to="/login" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2 text-base">
                      <LogIn className="w-5 h-5" />
                      <span>Sign In to Portal</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Trust Indicators */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-charcoal-500">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-brand-600" /> Instant Registration
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-brand-600" /> No Verification Delays
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-brand-600" /> Full EGP Currency Support
              </span>
            </div>
          </div>

          {/* ── Interactive Preview Mockup ── */}
          <div id="preview" className="mt-14 sm:mt-18 max-w-5xl mx-auto">
            <div className="rounded-2xl border border-charcoal-200/80 bg-white p-3 sm:p-5 shadow-2xl shadow-charcoal-900/10 ring-1 ring-charcoal-900/5">
              {/* Fake Browser Top Bar */}
              <div className="flex items-center justify-between border-b border-charcoal-100 pb-3 mb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-mono text-charcoal-400">rentify.app/portal</span>
                </div>
                <div className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700">
                  Live Preview
                </div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stat 1 */}
                <div className="rounded-xl border border-charcoal-100 bg-charcoal-50/50 p-4">
                  <div className="flex items-center justify-between text-xs text-charcoal-500 font-medium">
                    <span>Monthly Invoiced</span>
                    <CreditCard className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-charcoal-900">EGP 145,000</div>
                  <p className="mt-1 text-[11px] text-emerald-600 font-medium">↑ 12% from last month</p>
                </div>

                {/* Stat 2 */}
                <div className="rounded-xl border border-charcoal-100 bg-charcoal-50/50 p-4">
                  <div className="flex items-center justify-between text-xs text-charcoal-500 font-medium">
                    <span>Occupancy Rate</span>
                    <Building2 className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-charcoal-900">92.4%</div>
                  <p className="mt-1 text-[11px] text-charcoal-500">23 of 25 Units Rented</p>
                </div>

                {/* Stat 3 */}
                <div className="rounded-xl border border-charcoal-100 bg-charcoal-50/50 p-4">
                  <div className="flex items-center justify-between text-xs text-charcoal-500 font-medium">
                    <span>Active Contracts</span>
                    <FileText className="w-4 h-4 text-brand-600" />
                  </div>
                  <div className="mt-2 text-2xl font-bold text-charcoal-900">23 Leases</div>
                  <p className="mt-1 text-[11px] text-brand-600 font-medium">100% verified status</p>
                </div>
              </div>

              {/* Sample Unit Cards */}
              <div className="mt-4 pt-4 border-t border-charcoal-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-charcoal-500">
                    Sample Rental Units
                  </h3>
                  <span className="text-xs text-brand-600 font-semibold">Real-Time Sync</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg border border-charcoal-200 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-charcoal-800">Unit 301 - Zamalek</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                        Available
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-500 mt-1">2 Bed • 2 Bath • 140 m²</p>
                    <p className="text-xs font-bold text-charcoal-900 mt-2">EGP 18,500 / mo</p>
                  </div>
                  <div className="p-3 rounded-lg border border-charcoal-200 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-charcoal-800">Villa 4B - New Cairo</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                        Reserved
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-500 mt-1">4 Bed • 3 Bath • 320 m²</p>
                    <p className="text-xs font-bold text-charcoal-900 mt-2">EGP 45,000 / mo</p>
                  </div>
                  <div className="p-3 rounded-lg border border-charcoal-200 bg-white">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-charcoal-800">Penthouse - Maadi</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                        Rented
                      </span>
                    </div>
                    <p className="text-xs text-charcoal-500 mt-1">3 Bed • 3 Bath • 210 m²</p>
                    <p className="text-xs font-bold text-charcoal-900 mt-2">EGP 28,000 / mo</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Solutions Section (Owners & Tenants) ── */}
      <section id="solutions" className="py-16 sm:py-24 bg-white border-y border-charcoal-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">Tailored Solutions</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-charcoal-900 sm:text-4xl">
              Engineered for Both Owners & Tenants
            </p>
            <p className="mt-3 text-sm text-charcoal-500">
              Rentify provides dedicated tools designed specifically for your role in the rental ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Owner Solution */}
            <div className="rounded-2xl border border-charcoal-200 bg-charcoal-50/40 p-8 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white mb-6">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal-900">For Property Owners</h3>
              <p className="mt-2 text-sm text-charcoal-600">
                Maximize rental revenue, eliminate vacancies, and manage multiple buildings and units seamlessly.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-charcoal-700">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                  <span>Organize properties and multi-unit portfolios with granular controls</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                  <span>Create and manage rental contracts with automated unit status transitions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                  <span>Monitor rent payment receipts, schedules, and overdue notices</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                  <span>Review and assign maintenance requests from tenants in real time</span>
                </li>
              </ul>
              <div className="mt-8">
                <Link to="/register">
                  <Button variant="primary" className="w-full sm:w-auto">
                    Register as Property Owner
                  </Button>
                </Link>
              </div>
            </div>

            {/* Tenant Solution */}
            <div className="rounded-2xl border border-charcoal-200 bg-charcoal-50/40 p-8 hover:shadow-lg transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-charcoal-900 text-white mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-charcoal-900">For Tenants & Renters</h3>
              <p className="mt-2 text-sm text-charcoal-600">
                Enjoy transparent leasing, straightforward payment schedules, and rapid maintenance support.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-charcoal-700">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                  <span>Browse detailed unit listings with accurate pricing in Egyptian Pounds</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                  <span>Digitally review lease terms, security deposits, and contract durations</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                  <span>View payment history and keep records of all past rental transactions</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                  <span>Quickly submit maintenance tickets and track resolution progress</span>
                </li>
              </ul>
              <div className="mt-8">
                <Link to="/register">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Register as Tenant
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Core Features Grid ── */}
      <section id="features" className="py-16 sm:py-24 bg-charcoal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">Platform Capabilities</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-charcoal-900 sm:text-4xl">
              Everything Needed for Seamless Operations
            </p>
            <p className="mt-3 text-sm text-charcoal-500">
              Built using cutting-edge enterprise standards to ensure reliability, security, and speed.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="rounded-xl border border-charcoal-200 bg-white p-6 shadow-sm hover:border-brand-500 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <Layers className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-charcoal-900">Units & Properties</h4>
              <p className="mt-2 text-xs text-charcoal-600 leading-relaxed">
                Structured property listings with detailed unit specifications, amenities, rooms, square meters, and availability tracking.
              </p>
            </div>

            <div className="rounded-xl border border-charcoal-200 bg-white p-6 shadow-sm hover:border-brand-500 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <FileText className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-charcoal-900">Contract Lifecycle</h4>
              <p className="mt-2 text-xs text-charcoal-600 leading-relaxed">
                Strict state-driven contracts (Pending, Active, Terminated, Cancelled) with automatic unit status locking and deposit snapshots.
              </p>
            </div>

            <div className="rounded-xl border border-charcoal-200 bg-white p-6 shadow-sm hover:border-brand-500 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <CreditCard className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-charcoal-900">Financial Tracking</h4>
              <p className="mt-2 text-xs text-charcoal-600 leading-relaxed">
                Accurate rent invoicing, payment status records, and financial visibility with full Egyptian Pound (EGP) formatting.
              </p>
            </div>

            <div className="rounded-xl border border-charcoal-200 bg-white p-6 shadow-sm hover:border-brand-500 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <Wrench className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-charcoal-900">Maintenance Tickets</h4>
              <p className="mt-2 text-xs text-charcoal-600 leading-relaxed">
                Tenants can log maintenance issues with descriptions and urgency levels; owners can triage and update status until resolved.
              </p>
            </div>

            <div className="rounded-xl border border-charcoal-200 bg-white p-6 shadow-sm hover:border-brand-500 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-charcoal-900">Enterprise Security</h4>
              <p className="mt-2 text-xs text-charcoal-600 leading-relaxed">
                In-memory JWT token architecture, rotating refresh tokens with reuse detection, and role-based access control (RBAC).
              </p>
            </div>

            <div className="rounded-xl border border-charcoal-200 bg-white p-6 shadow-sm hover:border-brand-500 transition-colors">
              <div className="h-10 w-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h4 className="text-lg font-bold text-charcoal-900">Analytics & Insights</h4>
              <p className="mt-2 text-xs text-charcoal-600 leading-relaxed">
                Comprehensive reporting of rental returns, vacancy rates, and contract durations to help you make informed decisions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white border-t border-charcoal-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">Getting Started</h2>
            <p className="mt-2 text-3xl font-extrabold tracking-tight text-charcoal-900 sm:text-4xl">
              Up and Running in 3 Steps
            </p>
            <p className="mt-3 text-sm text-charcoal-500">
              No complicated setups or lengthy onboarding. Get started immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl border border-charcoal-100 bg-charcoal-50/50">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white font-bold text-lg mb-4 shadow-md shadow-brand-600/20">
                1
              </div>
              <h4 className="text-lg font-bold text-charcoal-900">Sign Up Instantly</h4>
              <p className="mt-2 text-xs text-charcoal-600">
                Create your account as an Owner or Tenant. No email verification waiting period — start right away.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border border-charcoal-100 bg-charcoal-50/50">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white font-bold text-lg mb-4 shadow-md shadow-brand-600/20">
                2
              </div>
              <h4 className="text-lg font-bold text-charcoal-900">List or Find Units</h4>
              <p className="mt-2 text-xs text-charcoal-600">
                Owners publish properties and units; tenants browse available properties and discover their ideal rental.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl border border-charcoal-100 bg-charcoal-50/50">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white font-bold text-lg mb-4 shadow-md shadow-brand-600/20">
                3
              </div>
              <h4 className="text-lg font-bold text-charcoal-900">Contract & Manage</h4>
              <p className="mt-2 text-xs text-charcoal-600">
                Execute digital leases, track rent dues, and file maintenance tickets through an all-in-one portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Call To Action Banner ── */}
      <section className="py-16 sm:py-20 bg-charcoal-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-800/40 via-charcoal-900 to-charcoal-950 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Modernize Your Rental Experience?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-charcoal-300 max-w-xl mx-auto">
            Join Rentify today. Enjoy seamless leasing, instant transparency, and effortless property management.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/register" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto gap-2">
                <span>Create Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/login" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-white border-charcoal-700 hover:bg-charcoal-800"
              >
                <span>Sign In to Portal</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mt-auto border-t border-charcoal-200 bg-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-sm">
              <Home className="h-4 w-4" />
            </div>
            <span className="font-bold text-charcoal-900 tracking-tight">Rentify</span>
            <span className="text-xs text-charcoal-400">© {new Date().getFullYear()} All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-charcoal-500 font-medium">
            <Link to="/login" className="hover:text-brand-600 transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-brand-600 transition-colors">
              Register
            </Link>
            <Link to="/dashboard" className="hover:text-brand-600 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
