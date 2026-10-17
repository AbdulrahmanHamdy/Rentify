import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, MapPin, Layers, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { PropertyDto } from '@/types';

export interface PropertyCardProps {
  property: PropertyDto;
  isOwner?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, isOwner = false }) => {
  return (
    <div className="group flex flex-col rounded-xl border border-charcoal-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Property Image Placeholder (visible 'No photo' treatment) */}
      <div className="relative h-44 w-full bg-charcoal-100 flex flex-col items-center justify-center text-charcoal-400 border-b border-charcoal-200 overflow-hidden">
        <div className="flex flex-col items-center gap-1.5 p-4 text-center">
          <Building2 className="w-10 h-10 text-charcoal-300 stroke-[1.5]" />
          <span className="text-xs font-medium uppercase tracking-wider text-charcoal-400">
            No photo available
          </span>
        </div>

        {/* Unit count pill */}
        <div className="absolute top-3 right-3">
          <Badge variant="brand" className="font-semibold shadow-xs">
            <Layers className="w-3.5 h-3.5 mr-1" />
            {property.unitCount} {property.unitCount === 1 ? 'Unit' : 'Units'}
          </Badge>
        </div>
      </div>

      {/* Property Details */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-charcoal-900 group-hover:text-brand-700 transition-colors line-clamp-1">
            {property.name}
          </h3>

          <div className="mt-2 flex items-start gap-1.5 text-xs text-charcoal-500">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-charcoal-400" />
            <span className="line-clamp-2">
              {property.address}
              {property.city ? `, ${property.city}` : ''}
            </span>
          </div>

          {property.description && (
            <p className="mt-2 text-xs text-charcoal-600 line-clamp-2">{property.description}</p>
          )}
        </div>

        <div className="mt-5 pt-4 border-t border-charcoal-100 flex items-center justify-between">
          <span className="text-xs text-charcoal-500">
            {isOwner ? 'Manage units & contracts' : 'View property details'}
          </span>
          <Link
            to={`/properties/${property.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 transition-colors"
          >
            <span>View</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
