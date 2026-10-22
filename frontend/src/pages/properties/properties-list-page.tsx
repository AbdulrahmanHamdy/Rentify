import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Search, Building2, MapPin, X, Filter } from 'lucide-react';
import { propertiesService } from '@/services/properties.service';
import { useAuth } from '@/features/auth/use-auth';
import { PropertyCard } from '@/components/shared/property-card';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { Badge } from '@/components/ui/badge';

const POPULAR_CITIES = [
  'Cairo',
  'Giza',
  'Alexandria',
  'New Cairo',
  '6th of October',
];

export const PropertiesListPage: React.FC = () => {
  const { hasRole, primaryRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isOwner = primaryRole === 'Owner';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
  const city = searchParams.get('city') || '';
  const mine = searchParams.get('mine') === 'true' || (isOwner && !searchParams.has('mine'));
  const sortBy = searchParams.get('sortBy') || '';

  const [searchInput, setSearchInput] = useState(search);

  // Sync debounced search to URL query param
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (searchInput.trim()) {
          next.set('search', searchInput.trim());
        } else {
          next.delete('search');
        }
        next.set('page', '1');
        return next;
      });
    }, 350);

    return () => clearTimeout(handler);
  }, [searchInput, setSearchParams]);

  // Combined search term for the query: if city is selected, search term considers both or city
  const activeSearchTerm = city ? (search ? `${search} ${city}` : city) : search;

  const { data, isLoading, error } = useQuery({
    queryKey: ['properties', { page, pageSize: 9, search: activeSearchTerm, mine, sortBy }],
    queryFn: () =>
      propertiesService.getProperties({
        page,
        pageSize: 9,
        search: activeSearchTerm,
        mine,
        sortBy,
      }),
  });

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', newPage.toString());
      return next;
    });
  };

  const handleToggleMine = (showMine: boolean) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (showMine) {
        next.set('mine', 'true');
      } else {
        next.delete('mine');
      }
      next.set('page', '1');
      return next;
    });
  };

  const handleCitySelect = (selectedCity: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (city === selectedCity) {
        next.delete('city');
      } else {
        next.set('city', selectedCity);
      }
      next.set('page', '1');
      return next;
    });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    setSearchParams(() => {
      const next = new URLSearchParams();
      if (mine && isOwner) next.set('mine', 'true');
      return next;
    });
  };

  const hasActiveFilters = !!search || !!city || !!sortBy;

  return (
    <div className="space-y-6">
      <PageHeader
        title={mine ? 'My Properties' : 'Explore Properties'}
        description={
          mine
            ? 'Manage and monitor all properties registered under your ownership profile'
            : 'Browse verified real estate properties and available rental units across Egypt'
        }
        action={
          hasRole('Owner') ? (
            <Link to="/properties/create">
              <Button variant="primary">
                <Plus className="w-4 h-4 mr-1.5" />
                Add Property
              </Button>
            </Link>
          ) : null
        }
      />

      {/* Main Filter & Search Control Panel */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-charcoal-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search by property name, address, or district..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 text-sm rounded-xl border border-charcoal-300 bg-white placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Controls: Mine/Public & Sorting */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {hasRole('Owner') && (
              <div className="flex items-center rounded-xl border border-charcoal-200 p-0.5 bg-charcoal-50 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleToggleMine(true)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    mine
                      ? 'bg-white text-brand-700 shadow-xs font-bold'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  My Portfolio
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMine(false)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    !mine
                      ? 'bg-white text-brand-700 shadow-xs font-bold'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  All Properties
                </button>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-charcoal-400 hidden sm:block" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    if (e.target.value) next.set('sortBy', e.target.value);
                    else next.delete('sortBy');
                    return next;
                  });
                }}
                aria-label="Sort properties"
                className="text-xs font-medium rounded-xl border border-charcoal-300 bg-white px-3 py-2 text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Default Sort</option>
                <option value="name">Name (A-Z)</option>
                <option value="city">City</option>
                <option value="createdAt">Recently Added</option>
              </select>
            </div>
          </div>
        </div>

        {/* City Filter Pills */}
        <div className="pt-2 border-t border-charcoal-100 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-charcoal-500 mr-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-brand-600" />
            Location:
          </span>

          <button
            onClick={() => handleCitySelect('')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              !city
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200'
            }`}
          >
            All Cities
          </button>

          {POPULAR_CITIES.map((c) => (
            <button
              key={c}
              onClick={() => handleCitySelect(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                city === c
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200'
              }`}
            >
              {c}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="ml-auto text-xs text-brand-700 hover:text-brand-900 font-semibold hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Reset filters
            </button>
          )}
        </div>
      </div>

      <ErrorAlert error={error} />

      {/* Property Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-charcoal-200 bg-white p-4 space-y-3">
              <Skeleton className="h-44 w-full rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="pt-2 flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.items && data.items.length > 0 ? (
        <>
          <div className="flex items-center justify-between text-xs text-charcoal-500 px-1">
            <span>
              Showing <span className="font-semibold text-charcoal-900">{data.items.length}</span> of{' '}
              <span className="font-semibold text-charcoal-900">{data.totalCount}</span> properties
              {city && <span> in <Badge variant="brand" className="ml-1 text-[10px]">{city}</Badge></span>}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.items.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          <Pagination
            currentPage={data.page ?? 1}
            totalPages={data.totalPages ?? 1}
            totalCount={data.totalCount ?? 0}
            pageSize={data.pageSize ?? 9}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <EmptyState
          icon={Building2}
          title={hasActiveFilters ? 'No matching properties found' : 'No properties registered yet'}
          description={
            hasActiveFilters
              ? 'Try relaxing your search terms or clearing your location filter to view more listings.'
              : isOwner
              ? 'Start building your rental portfolio by clicking "Add Property" above.'
              : 'New properties are being added to the catalog. Please check back soon.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            ) : hasRole('Owner') ? (
              <Link to="/properties/create">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add First Property
                </Button>
              </Link>
            ) : undefined
          }
        />
      )}
    </div>
  );
};
