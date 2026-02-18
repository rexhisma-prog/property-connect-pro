import { Property } from '@/lib/supabase-types';
import { Link } from 'react-router-dom';
import { MapPin, BedDouble, Bath, Maximize2, Eye, Star, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PropertyCardProps {
  property: Property;
}

function formatPrice(price: number, currency: string = 'EUR') {
  return new Intl.NumberFormat('sq-AL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
}

export default function PropertyCard({ property }: PropertyCardProps) {
  const isActiveFeatured = property.is_featured && property.featured_until && new Date(property.featured_until) > new Date();
  const isActiveUrgent = property.is_urgent && property.urgent_until && new Date(property.urgent_until) > new Date();
  const mainImage = property.images?.[0] || null;

  return (
    <Link to={`/properties/${property.id}`} className="group property-card block">
      {/* Image */}
      <div className="relative h-52 bg-secondary overflow-hidden">
        {mainImage ? (
          <img 
            src={mainImage} 
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary">
            <span className="text-4xl">🏠</span>
          </div>
        )}

        {/* Badges overlay */}
        <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap">
          {isActiveFeatured && (
            <span className="badge-featured flex items-center gap-1">
              <Star className="w-3 h-3" /> Featured
            </span>
          )}
          {isActiveUrgent && (
            <span className="badge-urgent flex items-center gap-1">
              <Zap className="w-3 h-3" /> Urgent
            </span>
          )}
        </div>

        {/* Type badge */}
        <div className="absolute top-2 right-2">
          <Badge 
            variant={property.listing_type === 'shitje' ? 'default' : 'secondary'}
            className={property.listing_type === 'shitje' ? 'bg-primary text-primary-foreground' : 'bg-green-600 text-white'}
          >
            {property.listing_type === 'shitje' ? 'Shitje' : 'Me Qira'}
          </Badge>
        </div>

        {/* Views */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
          <Eye className="w-3 h-3" />
          {property.views_count}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 group-hover:text-primary transition-colors flex-1">
            {property.title}
          </h3>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground text-xs mb-3">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{property.city}{property.address ? `, ${property.address}` : ''}</span>
        </div>

        {/* Price */}
        <p className="text-lg font-bold text-primary mb-3">
          {formatPrice(property.price, property.currency)}
          {property.listing_type === 'qira' && <span className="text-xs text-muted-foreground font-normal">/muaj</span>}
        </p>

        {/* Details */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground border-t border-border pt-3">
          {property.bedrooms && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-3.5 h-3.5" /> {property.bedrooms}
            </span>
          )}
          {property.bathrooms && (
            <span className="flex items-center gap-1">
              <Bath className="w-3.5 h-3.5" /> {property.bathrooms}
            </span>
          )}
          {property.area_m2 && (
            <span className="flex items-center gap-1">
              <Maximize2 className="w-3.5 h-3.5" /> {property.area_m2}m²
            </span>
          )}
          <span className="ml-auto text-muted-foreground capitalize">
            {property.property_type === 'apartment' ? 'Apartament' : 
             property.property_type === 'house' ? 'Shtëpi' :
             property.property_type === 'land' ? 'Tokë' : 'Lokal'}
          </span>
        </div>
      </div>
    </Link>
  );
}
