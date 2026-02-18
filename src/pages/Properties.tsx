import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/lib/supabase-types';
import PropertyCard from '@/components/PropertyCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Search, MapPin, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { CITIES } from '@/lib/supabase-types';

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    city: searchParams.get('city') || '',
    listing_type: searchParams.get('type') || '',
    property_type: searchParams.get('property_type') || '',
    min_price: searchParams.get('min_price') || '',
    max_price: searchParams.get('max_price') || '',
    bedrooms: '',
  });

  useEffect(() => {
    fetchProperties();
  }, [filters]);

  const fetchProperties = async () => {
    setLoading(true);
    let query = supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('last_boosted_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (filters.city) query = query.eq('city', filters.city);
    if (filters.listing_type) query = query.eq('listing_type', filters.listing_type as any);
    if (filters.property_type) query = query.eq('property_type', filters.property_type as any);
    if (filters.min_price) query = query.gte('price', Number(filters.min_price));
    if (filters.max_price) query = query.lte('price', Number(filters.max_price));
    if (filters.bedrooms) query = query.gte('bedrooms', Number(filters.bedrooms));

    const { data } = await query.limit(60);
    setProperties((data as Property[]) || []);
    setLoading(false);
  };

  const updateFilter = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Filter Bar */}
      <div className="bg-white border-b border-border sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Quick filters */}
            <div className="flex gap-2">
              {['', 'shitje', 'qira'].map(type => (
                <button
                  key={type}
                  onClick={() => updateFilter('listing_type', type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filters.listing_type === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-border'
                  }`}
                >
                  {type === '' ? 'Të gjitha' : type === 'shitje' ? 'Shitje' : 'Me Qira'}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-border" />

            {/* City select */}
            <select
              value={filters.city}
              onChange={e => updateFilter('city', e.target.value)}
              className="text-xs border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Të gjitha qytetet</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Property type */}
            <select
              value={filters.property_type}
              onChange={e => updateFilter('property_type', e.target.value)}
              className="text-xs border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Të gjitha llojet</option>
              <option value="apartment">Apartament</option>
              <option value="house">Shtëpi</option>
              <option value="land">Tokë</option>
              <option value="commercial">Lokal</option>
            </select>

            {/* More filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filtra të tjerë
            </button>

            <span className="ml-auto text-xs text-muted-foreground">
              {loading ? 'Duke kërkuar...' : `${properties.length} prona`}
            </span>
          </div>

          {/* Extended filters */}
          {showFilters && (
            <div className="flex gap-3 flex-wrap mt-3 pt-3 border-t border-border">
              <input
                type="number"
                placeholder="Çmimi min (€)"
                value={filters.min_price}
                onChange={e => updateFilter('min_price', e.target.value)}
                className="text-xs border border-border rounded-lg px-3 py-1.5 bg-background w-32 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                placeholder="Çmimi max (€)"
                value={filters.max_price}
                onChange={e => updateFilter('max_price', e.target.value)}
                className="text-xs border border-border rounded-lg px-3 py-1.5 bg-background w-32 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <select
                value={filters.bedrooms}
                onChange={e => updateFilter('bedrooms', e.target.value)}
                className="text-xs border border-border rounded-lg px-3 py-1.5 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Dhoma (të gjitha)</option>
                <option value="1">1+ dhomë</option>
                <option value="2">2+ dhoma</option>
                <option value="3">3+ dhoma</option>
                <option value="4">4+ dhoma</option>
              </select>
              <button
                onClick={() => setFilters({ city: '', listing_type: '', property_type: '', min_price: '', max_price: '', bedrooms: '' })}
                className="text-xs text-destructive hover:underline"
              >
                Pastro filtrat
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Property Grid */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="property-card animate-pulse">
                <div className="h-52 bg-secondary" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-secondary rounded" />
                  <div className="h-3 bg-secondary rounded w-2/3" />
                  <div className="h-5 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🏠</p>
            <h2 className="text-xl font-semibold text-foreground mb-2">Nuk u gjet asnjë pronë</h2>
            <p className="text-muted-foreground">Provoni të ndryshoni filtrat e kërkimit</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {properties.map(property => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
