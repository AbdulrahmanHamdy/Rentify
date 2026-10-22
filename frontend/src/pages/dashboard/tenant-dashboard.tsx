import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  Home,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  Wrench,
  FileText,
  MessageCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Building,
  DollarSign,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/features/auth/use-auth';
import { propertiesService } from '@/services/properties.service';
import { contractsService } from '@/services/contracts.service';
import { maintenanceService } from '@/services/maintenance.service';
import { useToast } from '@/components/ui/toast';
import { queryClient } from '@/lib/query-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate, formatCurrency } from '@/lib/utils';
import type { ContractDto, PropertyDto } from '@/types';

// Curated high quality property imagery for renter visual appeal
const PROPERTY_IMAGES = [
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
];

export const TenantDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Search state
  const [searchLocation, setSearchLocation] = useState('');
  const [propertyType, setPropertyType] = useState('All');
  const [priceRange, setPriceRange] = useState('All');

  // Favorites state
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('rentify_tenant_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('rentify_tenant_favorites', JSON.stringify(next));
      } catch {
        // ignore storage error
      }
      return next;
    });
  };

  // Carousel ref
  const carouselRef = useRef<HTMLDivElement>(null);
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const offset = direction === 'left' ? -320 : 320;
      carouselRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  // Modals state
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isNewMaintenanceModalOpen, setIsNewMaintenanceModalOpen] = useState(false);
  const toast = useToast();

  // New Maintenance Request Form State
  const [newTicketTitle, setNewTicketTitle] = useState('');
  const [newTicketCategory, setNewTicketCategory] = useState('Plumbing');
  const [newTicketUrgency, setNewTicketUrgency] = useState<'Low' | 'Medium' | 'High' | 'Emergency'>('Medium');
  const [newTicketDescription, setNewTicketDescription] = useState('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Maintenance list state from real API
  const { data: realMaintenanceData } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => maintenanceService.getRequests({ pageSize: 5 }),
    enabled: !!user,
  });

  const maintenanceRequests = realMaintenanceData?.items || [];

  const handleCreateMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketTitle.trim()) return;
    if (!activeContract?.unitId) {
      toast.error('You need an active lease contract to file maintenance requests.');
      return;
    }

    const priorityMap: Record<string, number> = {
      Low: 1,
      Medium: 2,
      High: 3,
      Emergency: 4,
    };

    setIsSubmittingTicket(true);
    try {
      await maintenanceService.createRequest({
        unitId: activeContract.unitId,
        title: `[${newTicketCategory}] ${newTicketTitle.trim()}`,
        description: newTicketDescription.trim() || newTicketTitle.trim(),
        priority: priorityMap[newTicketUrgency] || 2,
      });

      await queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      setNewTicketTitle('');
      setNewTicketDescription('');
      setIsNewMaintenanceModalOpen(false);
      toast.success('Maintenance ticket submitted to your property manager.');
    } catch {
      toast.error('Failed to submit maintenance ticket. Please try again.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // 1. Fetch user's contracts
  const { data: contractsData, isLoading: isLoadingContracts } = useQuery({
    queryKey: ['contracts', { pageSize: 50 }],
    queryFn: () => contractsService.getContracts({ pageSize: 50 }),
    enabled: !!user,
  });

  // 2. Fetch properties for recommendation
  const { data: propertiesData, isLoading: isLoadingProperties } = useQuery({
    queryKey: ['properties', { pageSize: 12 }],
    queryFn: () => propertiesService.getProperties({ pageSize: 12 }),
  });

  const contracts: ContractDto[] = contractsData?.items || [];
  const activeContract = contracts.find((c) => c.status === 'Active');
  const recentContract = contracts[0] || null;
  const properties: PropertyDto[] = propertiesData?.items || [];

  // Calculate days remaining in active lease
  const getDaysRemaining = (endDateStr?: string) => {
    if (!endDateStr) return null;
    const end = new Date(endDateStr).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const daysRemaining = getDaysRemaining(activeContract?.endDate);

  // Greeting by time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = user?.email ? user.email.split('@')[0] : 'friend';

  // Search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    const queryParts: string[] = [];
    if (searchLocation.trim()) queryParts.push(searchLocation.trim());
    if (propertyType !== 'All') queryParts.push(propertyType);
    if (queryParts.length > 0) params.append('search', queryParts.join(' '));
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <div className="space-y-10">
      {/* ── 1. Greeting + Consumer Search Bar ── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-teal-700 to-teal-900 p-6 sm:p-10 text-white shadow-lg">
        {/* Decorative background glow */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-teal-400/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-amber-200 text-xs font-semibold mb-3 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Find your next home in Egypt</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            {getGreeting()}, <span className="capitalize">{displayName}</span>!
          </h1>
          <p className="mt-2 text-sm sm:text-base text-teal-100/90 leading-relaxed max-w-xl">
            Manage your lease, stay on top of rent installments, and discover verified rental homes with zero hassle.
          </p>

          {/* Quick Search Form */}
          <form
            onSubmit={handleSearch}
            className="mt-6 sm:mt-8 p-2 rounded-2xl bg-white/95 backdrop-blur-md shadow-xl text-charcoal-800 grid grid-cols-1 sm:grid-cols-5 gap-2 border border-white/40"
          >
            {/* Location */}
            <div className="sm:col-span-2 relative flex items-center px-3 py-1.5 border-b sm:border-b-0 sm:border-r border-amber-100">
              <MapPin className="w-4 h-4 text-teal-600 shrink-0 mr-2" />
              <input
                type="text"
                placeholder="City, area (e.g. Zamalek, New Cairo, Maadi)..."
                value={searchLocation}
                onChange={(e) => setSearchLocation(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent outline-none placeholder:text-charcoal-400 font-medium"
              />
            </div>

            {/* Property Type Filter */}
            <div className="flex items-center px-3 py-1.5 border-b sm:border-b-0 sm:border-r border-amber-100">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent outline-none text-charcoal-700 font-medium cursor-pointer"
                aria-label="Property type"
              >
                <option value="All">All Types</option>
                <option value="Apartment">Apartment</option>
                <option value="Villa">Villa</option>
                <option value="Penthouse">Penthouse</option>
                <option value="Studio">Studio</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="flex items-center px-3 py-1.5 border-b sm:border-b-0 sm:border-r border-amber-100">
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="w-full text-xs sm:text-sm bg-transparent outline-none text-charcoal-700 font-medium cursor-pointer"
                aria-label="Price range"
              >
                <option value="All">Any Budget</option>
                <option value="15000">Under 15k EGP</option>
                <option value="30000">15k - 30k EGP</option>
                <option value="50000">30k - 50k EGP</option>
                <option value="50001">50k+ EGP</option>
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex items-center">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-xl shadow-md gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Search</span>
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* ── 5. Quick Actions Row (Placed prominently for immediate renter utility) ── */}
      <section aria-label="Quick Actions">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => setIsNewMaintenanceModalOpen(true)}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-amber-200/60 shadow-xs hover:shadow-md hover:border-amber-400/80 transition-all text-left group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700 group-hover:scale-105 transition-transform shrink-0">
              <Wrench className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-charcoal-900 group-hover:text-amber-700 transition-colors">
                Report an Issue
              </h4>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Plumbing, AC, electrical repairs
              </p>
            </div>
          </button>

          <Link
            to="/contracts"
            className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-teal-200/60 shadow-xs hover:shadow-md hover:border-teal-400/80 transition-all text-left group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700 group-hover:scale-105 transition-transform shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-charcoal-900 group-hover:text-teal-700 transition-colors">
                View Contract
              </h4>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Lease terms & deposit details
              </p>
            </div>
          </Link>

          <button
            onClick={() => setIsContactModalOpen(true)}
            className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-blue-200/60 shadow-xs hover:shadow-md hover:border-blue-400/80 transition-all text-left group"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:scale-105 transition-transform shrink-0">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-charcoal-900 group-hover:text-blue-700 transition-colors">
                Contact Owner
              </h4>
              <p className="text-xs text-charcoal-500 mt-0.5">
                Direct inquiry to manager
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* ── 2 & 3: "My Home" Card and Next Payment Card ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── 2. "My Home" Card (7 Cols) ── */}
        <div className="lg:col-span-7">
          <Card className="h-full border-amber-200/60 shadow-xs bg-white rounded-3xl overflow-hidden flex flex-col justify-between">
            <CardContent className="p-0 flex-1 flex flex-col justify-between">
              {isLoadingContracts ? (
                <div className="p-6 space-y-4">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-44 w-full rounded-2xl" />
                </div>
              ) : activeContract ? (
                <div className="flex flex-col h-full">
                  {/* Photo Banner */}
                  <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-charcoal-100">
                    <img
                      src={PROPERTY_IMAGES[0]}
                      alt={activeContract.propertyName || 'My Rental Home'}
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/80 via-charcoal-950/20 to-transparent" />

                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-600/90 text-white text-xs font-semibold backdrop-blur-md shadow-xs">
                        <Home className="w-3.5 h-3.5" />
                        <span>Active Lease</span>
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <h2 className="text-xl sm:text-2xl font-bold leading-tight">
                        {activeContract.propertyName}
                      </h2>
                      <p className="text-xs sm:text-sm text-amber-200 font-medium mt-0.5">
                        Unit {activeContract.unitNumber}
                      </p>
                    </div>
                  </div>

                  {/* Lease Meta info */}
                  <div className="p-6 space-y-4 flex-1 flex flex-col justify-between bg-gradient-to-b from-white to-[#fdfbf9]">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                          Monthly Rent
                        </span>
                        <p className="mt-1 text-base sm:text-lg font-bold text-charcoal-900">
                          {formatCurrency(activeContract.monthlyRent)}
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-teal-50/70 border border-teal-200/60">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800">
                          Lease End Date
                        </span>
                        <p className="mt-1 text-sm sm:text-base font-bold text-charcoal-900">
                          {formatDate(activeContract.endDate)}
                        </p>
                      </div>

                      <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-charcoal-50 border border-charcoal-200/60">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-charcoal-600">
                          Time Remaining
                        </span>
                        <p className="mt-1 text-sm sm:text-base font-bold text-teal-700">
                          {daysRemaining !== null ? `${daysRemaining} days` : 'Ongoing'}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-amber-100">
                      <span className="text-xs text-charcoal-500">
                        Contract ID: #{activeContract.id}
                      </span>
                      <Link to={`/contracts/${activeContract.id}`}>
                        <Button variant="outline" size="sm" className="rounded-xl border-teal-600 text-teal-700 hover:bg-teal-50 gap-1.5">
                          <span>View Lease Agreement</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                /* Friendly Empty State for "My Home" */
                <div className="p-8 sm:p-10 text-center flex flex-col items-center justify-center my-auto">
                  <div className="relative mb-5">
                    <div className="absolute -inset-2 rounded-full bg-amber-300/30 blur-lg" />
                    <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-100 text-amber-700 shadow-inner">
                      <Home className="h-10 w-10 text-amber-700" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-charcoal-900">
                    You don&apos;t have an active lease yet
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-charcoal-500 max-w-md leading-relaxed">
                    Explore verified rental apartments and villas in Cairo, Giza, and coastal cities. Apply online with digital contract protection.
                  </p>

                  <div className="mt-6">
                    <Link to="/properties">
                      <Button
                        variant="primary"
                        size="md"
                        className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-md gap-2"
                      >
                        <Search className="w-4 h-4" />
                        <span>Browse Available Properties</span>
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── 3. Next Payment Card (5 Cols) ── */}
        <div className="lg:col-span-5">
          <Card className="h-full border-teal-200/60 shadow-xs bg-white rounded-3xl flex flex-col justify-between">
            <CardContent className="p-6 sm:p-7 flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-amber-100">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-charcoal-900">Next Rent Payment</h3>
                      <p className="text-[11px] text-charcoal-500">Upcoming installment</p>
                    </div>
                  </div>

                  {activeContract ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                      <Clock className="w-3 h-3" />
                      <span>Due Soon</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-100 text-teal-800">
                      <ShieldCheck className="w-3 h-3" />
                      <span>All Clear</span>
                    </span>
                  )}
                </div>

                {activeContract ? (
                  <div className="mt-6 space-y-6">
                    {/* Amount & Due Date */}
                    <div className="p-5 rounded-2xl bg-[#faf7f2] border border-amber-200/60 text-center">
                      <span className="text-xs uppercase font-semibold text-charcoal-500 tracking-wider">
                        Amount Due
                      </span>
                      <div className="mt-1 text-3xl font-extrabold text-charcoal-900 tracking-tight">
                        {formatCurrency(activeContract.monthlyRent)}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-900 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>Due on {formatDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())}</span>
                      </div>
                    </div>

                    {/* Small Installment Timeline */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-charcoal-500 mb-3">
                        Installment Schedule
                      </h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-teal-50/60 border border-teal-100 text-xs">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-teal-600" />
                            <span className="font-semibold text-charcoal-800">Previous Month</span>
                          </div>
                          <span className="font-bold text-teal-700">Paid ✓</span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white font-bold text-[10px]">
                              ●
                            </span>
                            <span className="font-bold text-charcoal-900">Current Month</span>
                          </div>
                          <span className="font-bold text-amber-800">Due Soon</span>
                        </div>

                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-charcoal-50/60 border border-charcoal-200/50 text-xs text-charcoal-500">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-charcoal-400" />
                            <span>Next Month</span>
                          </div>
                          <span>Scheduled</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Empty state for next payment */
                  <div className="py-12 text-center text-xs text-charcoal-500 space-y-2">
                    <p className="font-medium text-charcoal-700">No installments due</p>
                    <p className="max-w-xs mx-auto text-charcoal-500">
                      When you enter into an active lease contract, your monthly rent schedule and receipt tracking will appear here.
                    </p>
                  </div>
                )}
              </div>

              {/* Action */}
              <div className="mt-6 pt-4 border-t border-amber-100 flex items-center justify-between">
                <Link to="/payments" className="text-xs text-teal-700 font-semibold hover:underline">
                  Payment History →
                </Link>
                {activeContract && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsPayModalOpen(true)}
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl gap-1.5 shadow-sm"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Now</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ── 4. Application Tracker (Stepper per contract request) ── */}
      <section aria-labelledby="application-tracker-heading">
        <Card className="border-amber-200/60 shadow-xs bg-white rounded-3xl">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-amber-100">
              <div>
                <h3 id="application-tracker-heading" className="text-lg font-bold text-charcoal-900">
                  Rental Application Tracker
                </h3>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  Real-time status of your lease submissions and approvals
                </p>
              </div>

              {recentContract && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-charcoal-500">Current Application:</span>
                  <span className="font-bold text-charcoal-900">
                    {recentContract.propertyName} (Unit {recentContract.unitNumber})
                  </span>
                </div>
              )}
            </div>

            {/* Stepper Logic */}
            {recentContract ? (
              <div className="mt-8">
                {/* 5-Step Progress Bar */}
                <div className="relative">
                  {/* Connecting Line */}
                  <div className="absolute top-5 left-6 right-6 h-1 bg-amber-100 -z-0" />

                  {/* Steps */}
                  <div className="grid grid-cols-5 text-center relative z-10">
                    {/* Step 1: Applied */}
                    <div className="flex flex-col items-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-white shadow-md shadow-teal-600/30">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="mt-2 text-xs font-bold text-charcoal-900">Applied</span>
                      <span className="text-[10px] text-teal-700">Submitted</span>
                    </div>

                    {/* Step 2: Under review */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-white shadow-md ${
                          recentContract.status === 'Pending'
                            ? 'bg-amber-500 ring-4 ring-amber-100 animate-pulse'
                            : recentContract.status === 'Active'
                            ? 'bg-teal-600'
                            : 'bg-amber-400'
                        }`}
                      >
                        {recentContract.status === 'Active' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>
                      <span className="mt-2 text-xs font-bold text-charcoal-900">Under Review</span>
                      <span className="text-[10px] text-charcoal-500">
                        {recentContract.status === 'Pending' ? 'In Progress' : 'Verified'}
                      </span>
                    </div>

                    {/* Step 3: Approved */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${
                          recentContract.status === 'Active'
                            ? 'bg-teal-600 shadow-md'
                            : 'bg-charcoal-200 text-charcoal-500'
                        }`}
                      >
                        {recentContract.status === 'Active' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="text-xs font-bold text-charcoal-600">3</span>
                        )}
                      </div>
                      <span className="mt-2 text-xs font-semibold text-charcoal-700">Approved</span>
                      <span className="text-[10px] text-charcoal-400">
                        {recentContract.status === 'Active' ? 'Accepted' : 'Pending'}
                      </span>
                    </div>

                    {/* Step 4: Signed */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${
                          recentContract.status === 'Active'
                            ? 'bg-teal-600 shadow-md'
                            : 'bg-charcoal-200 text-charcoal-500'
                        }`}
                      >
                        {recentContract.status === 'Active' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <span className="text-xs font-bold text-charcoal-600">4</span>
                        )}
                      </div>
                      <span className="mt-2 text-xs font-semibold text-charcoal-700">Signed</span>
                      <span className="text-[10px] text-charcoal-400">
                        {recentContract.status === 'Active' ? 'Complete' : 'Pending'}
                      </span>
                    </div>

                    {/* Step 5: Active */}
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-white ${
                          recentContract.status === 'Active'
                            ? 'bg-teal-600 shadow-md ring-4 ring-teal-100'
                            : 'bg-charcoal-200 text-charcoal-500'
                        }`}
                      >
                        <Home className="w-5 h-5" />
                      </div>
                      <span className="mt-2 text-xs font-bold text-charcoal-900">Active</span>
                      <span className="text-[10px] text-teal-700 font-semibold">
                        {recentContract.status === 'Active' ? 'Key Handover' : 'Final Step'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-amber-900">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {recentContract.status === 'Pending'
                        ? 'Your application has been received and is waiting for the property owner to review and confirm.'
                        : 'Your contract is active! Unit terms and obligations are fully locked.'}
                    </span>
                  </div>
                  <Link to={`/contracts/${recentContract.id}`}>
                    <Button variant="outline" size="sm" className="text-xs shrink-0 rounded-xl">
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              /* Informative Empty State for Application Tracker */
              <div className="mt-6 py-6 text-center">
                <div className="grid grid-cols-5 text-center mb-6 opacity-60">
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">1</div>
                    <span className="text-[10px] mt-1">Apply</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-charcoal-100 text-charcoal-600 flex items-center justify-center text-xs font-bold">2</div>
                    <span className="text-[10px] mt-1">Review</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-charcoal-100 text-charcoal-600 flex items-center justify-center text-xs font-bold">3</div>
                    <span className="text-[10px] mt-1">Approve</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-charcoal-100 text-charcoal-600 flex items-center justify-center text-xs font-bold">4</div>
                    <span className="text-[10px] mt-1">Sign</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-8 w-8 rounded-full bg-charcoal-100 text-charcoal-600 flex items-center justify-center text-xs font-bold">5</div>
                    <span className="text-[10px] mt-1">Move In</span>
                  </div>
                </div>
                <p className="text-xs text-charcoal-600 max-w-md mx-auto">
                  No active or pending lease applications yet. Find an available unit and apply with one click to track your journey here.
                </p>
                <Link to="/properties" className="inline-block mt-4">
                  <Button variant="outline" size="sm" className="rounded-xl border-teal-600 text-teal-700 hover:bg-teal-50">
                    Find a Unit to Apply
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── 6. "Recommended for you" Horizontal Carousel ── */}
      <section aria-labelledby="recommended-heading">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 id="recommended-heading" className="text-xl font-bold text-charcoal-900">
              Recommended for You
            </h3>
            <p className="text-xs text-charcoal-500">
              Verified rental properties handpicked across Egypt
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollCarousel('left')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-white text-charcoal-600 hover:bg-amber-50 shadow-xs transition-colors"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollCarousel('right')}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-200 bg-white text-charcoal-600 hover:bg-amber-50 shadow-xs transition-colors"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel container */}
        <div
          ref={carouselRef}
          className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x scrollbar-none no-scrollbar -mx-4 px-4 sm:-mx-0 sm:px-0"
        >
          {isLoadingProperties ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="min-w-[280px] sm:min-w-[320px] rounded-3xl bg-white p-3 border border-amber-100 shadow-xs">
                <Skeleton className="h-44 w-full rounded-2xl" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            ))
          ) : properties.length === 0 ? (
            <div className="w-full text-center py-10 bg-white rounded-3xl border border-amber-100 text-xs text-charcoal-500">
              No recommended properties listed yet. Check back soon!
            </div>
          ) : (
            properties.map((prop, index) => {
              const isFav = prop.id ? favorites.includes(prop.id) : false;
              const imgUrl = PROPERTY_IMAGES[index % PROPERTY_IMAGES.length];
              return (
                <div
                  key={prop.id}
                  className="min-w-[280px] sm:min-w-[320px] max-w-[320px] snap-start rounded-3xl bg-white border border-amber-200/60 shadow-xs hover:shadow-lg hover:border-teal-400/80 transition-all duration-200 flex flex-col justify-between overflow-hidden group"
                >
                  <Link to={`/properties/${prop.id}`} className="block relative">
                    <div className="relative h-44 w-full overflow-hidden bg-charcoal-100">
                      <img
                        src={imgUrl}
                        alt={prop.name || 'Property'}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/60 via-transparent to-transparent" />

                      {/* Favorite Button */}
                      <button
                        onClick={(e) => prop.id && toggleFavorite(prop.id, e)}
                        className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md shadow-md text-charcoal-600 hover:text-rose-600 hover:scale-110 transition-all"
                        aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            isFav ? 'fill-rose-500 text-rose-500' : 'text-charcoal-600'
                          }`}
                        />
                      </button>

                      {/* City badge */}
                      <div className="absolute bottom-3 left-3">
                        <span className="px-2.5 py-1 rounded-full bg-charcoal-950/70 text-white text-[11px] font-semibold backdrop-blur-md flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-400" />
                          <span>{prop.city || 'Cairo'}</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-charcoal-900 group-hover:text-teal-700 transition-colors line-clamp-1">
                          {prop.name}
                        </h4>
                        <p className="text-xs text-charcoal-500 mt-1 line-clamp-1">
                          {prop.address || 'Cairo, Egypt'}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-amber-100 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-charcoal-400 font-semibold block">
                            Available Units
                          </span>
                          <span className="text-xs font-bold text-teal-700">
                            {prop.unitCount ?? 1} Units listed
                          </span>
                        </div>
                        <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200/60">
                          Verified
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── 7. Maintenance Requests: Compact List with Status Chips ── */}
      <section aria-labelledby="maintenance-heading">
        <Card className="border-amber-200/60 shadow-xs bg-white rounded-3xl">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-amber-100">
              <div>
                <h3 id="maintenance-heading" className="text-lg font-bold text-charcoal-900">
                  Maintenance & Service Requests
                </h3>
                <p className="text-xs text-charcoal-500 mt-0.5">
                  Track repair tickets and communicate with building technicians
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsNewMaintenanceModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl gap-1.5 shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New Request</span>
              </Button>
            </div>

            {/* Ticket List */}
            <div className="mt-6">
              {maintenanceRequests.length === 0 ? (
                <div className="text-center py-10 text-xs text-charcoal-500">
                  <p className="font-semibold text-charcoal-700 text-sm">Everything is running smoothly</p>
                  <p className="mt-1">You have no active repair requests. Click &quot;New Request&quot; if anything needs fixing.</p>
                </div>
              ) : (
                <div className="divide-y divide-amber-100/80">
                  {maintenanceRequests.map((req) => {
                    const statusConfig = {
                      1: { label: 'Open', color: 'bg-amber-100 text-amber-800 border-amber-200' },
                      2: { label: 'In Progress', color: 'bg-teal-100 text-teal-800 border-teal-200' },
                      3: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                      4: { label: 'Cancelled', color: 'bg-charcoal-100 text-charcoal-600 border-charcoal-200' },
                    }[req.status] || { label: 'Open', color: 'bg-amber-100 text-amber-800' };

                    const prioConfig = {
                      1: 'Low',
                      2: 'Medium',
                      3: 'High',
                      4: 'Emergency',
                    }[req.priority] || 'Normal';

                    return (
                      <div
                        key={req.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50/30 px-2 rounded-2xl transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700 shrink-0 mt-0.5">
                            <Wrench className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-charcoal-900">
                                {req.title}
                              </span>
                              <span className="text-[10px] font-mono text-charcoal-400">
                                #{req.id}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-charcoal-500">
                              <span>Unit {req.unitNumber}</span>
                              <span>•</span>
                              <span>{req.propertyName}</span>
                              <span>•</span>
                              <span>{formatDate(req.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:self-center self-start">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>

                          <span className="text-[11px] font-semibold text-charcoal-500 px-2 py-0.5 rounded-lg bg-charcoal-100">
                            {prioConfig}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Modal 1: Quick Payment Modal ── */}
      <Dialog
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        title="Rent Payment Submission"
        description="Choose your preferred payment method for this month's installment"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-center">
            <span className="text-xs uppercase font-semibold text-amber-800">
              Total Installment Due
            </span>
            <div className="text-2xl font-bold text-charcoal-900 mt-1">
              {activeContract ? formatCurrency(activeContract.monthlyRent) : 'EGP 0'}
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <p className="font-semibold text-charcoal-800">Available Payment Channels:</p>
            <div className="p-3 rounded-xl border border-charcoal-200 hover:border-teal-500 cursor-pointer transition-colors flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-600" />
                <span className="font-semibold text-charcoal-900">Card Payment (Paymob)</span>
              </div>
              <Badge variant="brand">Ready in Phase 8</Badge>
            </div>
            <div className="p-3 rounded-xl border border-charcoal-200 hover:border-teal-500 cursor-pointer transition-colors flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-teal-600" />
                <span className="font-semibold text-charcoal-900">Bank Transfer (InstaPay / Wire)</span>
              </div>
              <span className="text-teal-700 font-semibold">Active</span>
            </div>
            <div className="p-3 rounded-xl border border-charcoal-200 hover:border-teal-500 cursor-pointer transition-colors flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-600" />
                <span className="font-semibold text-charcoal-900">Cash with Receipt to Building Manager</span>
              </div>
              <span className="text-teal-700 font-semibold">Active</span>
            </div>
          </div>

          <div className="pt-3 border-t border-charcoal-100 flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsPayModalOpen(false)}>
              Close
            </Button>
            <Link to="/payments">
              <Button
                variant="primary"
                size="sm"
                className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
              >
                Go to Payments Center
              </Button>
            </Link>
          </div>
        </div>
      </Dialog>

      {/* ── Modal 2: Contact Owner Modal ── */}
      <Dialog
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Contact Property Management"
        description="Connect with the verified property manager or landlord"
      >
        <div className="space-y-4 text-xs text-charcoal-600">
          <p>
            Your active contract is managed directly by the property owner registered on Rentify.
          </p>

          <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200 text-teal-900 space-y-2">
            <div className="font-semibold text-sm">Building Concierge & Support:</div>
            <p>• Building Manager Phone: +20 100 456 7890</p>
            <p>• Landlord Support Email: support@rentify.app</p>
            <p>• Emergency Maintenance Line: +20 122 333 4444 (24/7)</p>
          </div>

          <p className="text-[11px] text-charcoal-500">
            For official disputes or notices regarding contract terms, please submit an inquiry via the support center to preserve legal timestamps.
          </p>

          <div className="pt-3 border-t border-charcoal-100 flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setIsContactModalOpen(false)} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl">
              Done
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ── Modal 3: New Maintenance Request ── */}
      <Dialog
        isOpen={isNewMaintenanceModalOpen}
        onClose={() => setIsNewMaintenanceModalOpen(false)}
        title="Submit Maintenance Request"
        description="Notify your landlord and maintenance crew of an issue in your unit"
      >
        <form onSubmit={handleCreateMaintenance} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Issue Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Kitchen water heater leaking..."
              value={newTicketTitle}
              onChange={(e) => setNewTicketTitle(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-charcoal-200 p-2.5 outline-none focus:border-teal-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Category
              </label>
              <select
                value={newTicketCategory}
                onChange={(e) => setNewTicketCategory(e.target.value)}
                className="w-full text-xs rounded-xl border border-charcoal-200 p-2.5 outline-none focus:border-teal-600 bg-white"
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="HVAC">HVAC / AC</option>
                <option value="Carpentry">Carpentry / Doors</option>
                <option value="General">General / Painting</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal-700 mb-1">
                Urgency Level
              </label>
              <select
                value={newTicketUrgency}
                onChange={(e) => setNewTicketUrgency(e.target.value as 'Low' | 'Medium' | 'High' | 'Emergency')}
                className="w-full text-xs rounded-xl border border-charcoal-200 p-2.5 outline-none focus:border-teal-600 bg-white"
              >
                <option value="Low">Low (Within a week)</option>
                <option value="Medium">Medium (Within 48 hours)</option>
                <option value="High">High (Within 24 hours)</option>
                <option value="Emergency">Emergency (Immediate)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal-700 mb-1">
              Description & Specifics
            </label>
            <textarea
              rows={3}
              placeholder="Provide any details that will help the technician bring the correct tools..."
              value={newTicketDescription}
              onChange={(e) => setNewTicketDescription(e.target.value)}
              className="w-full text-xs rounded-xl border border-charcoal-200 p-2.5 outline-none focus:border-teal-600"
            />
          </div>

          <div className="pt-3 border-t border-charcoal-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsNewMaintenanceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingTicket}
              className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs"
            >
              Submit Ticket
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
