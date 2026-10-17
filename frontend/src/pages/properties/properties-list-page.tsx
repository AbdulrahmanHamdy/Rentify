import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Search, Building2 } from 'lucide-react';
import { propertiesService } from '@/services/properties.service';
import { useAuth } from '@/features/auth/use-auth';
import { PropertyCard } from '@/components/shared/property-card';
import { PageHeader } from '@/components/shared/page-header';
import { Pagination } from '@/components/shared/pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ErrorAlert } from '@/components/shared/error-alert';

export const PropertiesListPage: React.FC = () => {
  const { hasRole, primaryRole } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const isOwner = primaryRole === 'Owner';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('search') || '';
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
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput, setSearchParams]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['properties', { page, pageSize: 9, search, mine, sortBy }],
    queryFn: () =>
      propertiesService.getProperties({
        page,
        pageSize: 9,
        search,
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={mine ? 'My Properties' : 'Explore Properties'}
        description={
          mine
            ? 'Manage and monitor all properties registered under your ownership profile'
            : 'Browse verified real estate properties and available rental units'
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

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-charcoal-200 shadow-xs">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400" />
          <input
            type="text"
            placeholder="Search by name, address, or city..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-charcoal-300 bg-white placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {hasRole('Owner') && (
            <div className="flex items-center rounded-lg border border-charcoal-300 p-0.5 bg-charcoal-100/60 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleToggleMine(true)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  mine
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                My Properties
              </button>
              <button
                type="button"
                onClick={() => handleToggleMine(false)}
                className={`px-3 py-1.5 rounded-md transition-all ${
                  !mine
                    ? 'bg-white text-brand-700 shadow-xs'
                    : 'text-charcoal-600 hover:text-charcoal-900'
                }`}
              >
                All Public
              </button>
            </div>
          )}

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
            className="text-xs rounded-lg border border-charcoal-300 bg-white px-3 py-2 text-charcoal-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Default Sort</option>
            <option value="name">Sort by Name</option>
            <option value="city">Sort by City</option>
            <option value="createdAt">Sort by Date</option>
          </select>
        </div>
      </div>

      <ErrorAlert error={error} />

      {/* Property Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-charcoal-200 bg-white p-4 space-y-3">
              <Skeleton className="h-44 w-full rounded-lg" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-8 w-full mt-4" />
            </div>
          ))}
        </div>
      ) : data?.items?.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search ? 'No matching properties' : 'No properties found'}
          description={
            search
              ? `We couldn't find any properties matching "${search}". Try adjusting your search term.`
              : mine
              ? 'You have not registered any properties yet. Click Add Property to list your first building.'
              : 'There are currently no properties listed in the system.'
          }
          action={
            hasRole('Owner') ? (
              <Link to="/properties/create">
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-1.5" />
                  Add First Property
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data?.items?.map((property) => (
              <PropertyCard key={property.id} property={property} isOwner={mine} />
            ))}
          </div>

          <Pagination
            currentPage={data?.page || 1}
            totalPages={data?.totalPages || 1}
            totalCount={data?.totalCount || 0}
            pageSize={data?.pageSize || 9}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};
