import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CITIES } from '@/lib/supabase-types';
import heroBg from '@/assets/hero-bg.jpg';

export default function HeroSection() {
  const navigate = useNavigate();
  const [listingType, setListingType] = useState<'shitje' | 'qira'>('shitje');
  const [city, setCity] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (listingType) params.set('type', listingType);
    if (city) params.set('city', city);
    if (propertyType) params.set('property_type', propertyType);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    navigate(`/properties?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[580px] flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="Hero" className="w-full h-full object-cover" />
        <div className="hero-overlay absolute inset-0" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center py-20">
        <div className="animate-fade-in-up">
          <span className="inline-block bg-primary/20 backdrop-blur-sm border border-primary/30 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            🏠 Platforma #1 e Pronave në Kosovë & Shqipëri
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
            Gjej Pronën e <span className="text-primary">Ëndrrave Tua</span>
          </h1>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            Mbi 10,000 prona të listuara. Blej, shit ose qiraje me besim dhe lehtësi.
          </p>
        </div>

        {/* Search Card */}
        <div className="search-bar p-4 sm:p-6 max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setListingType('shitje')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                listingType === 'shitje' 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'bg-secondary text-muted-foreground hover:bg-border'
              }`}
            >
              Shitje
            </button>
            <button
              onClick={() => setListingType('qira')}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                listingType === 'qira' 
                  ? 'bg-primary text-primary-foreground shadow-md' 
                  : 'bg-secondary text-muted-foreground hover:bg-border'
              }`}
            >
              Me Qira
            </button>
          </div>

          {/* Search Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* City */}
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="">Të gjitha qytetet</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Property Type */}
            <div className="relative">
              <select
                value={propertyType}
                onChange={e => setPropertyType(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="">Lloji i pronës</option>
                <option value="apartment">Banesë</option>
                <option value="house">Shtëpi</option>
                <option value="land">Tokë</option>
                <option value="commercial">Lokal/Komercial</option>
              </select>
            </div>

            {/* Min Price */}
            <input
              type="number"
              placeholder="Çmimi min (€)"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              className="px-3 py-2.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />

            {/* Search Button */}
            <Button onClick={handleSearch} className="btn-orange h-10 gap-2">
              <Search className="w-4 h-4" />
              Kërko
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          {[
            { label: 'Prona Aktive', value: '10,000+' },
            { label: 'Qytete', value: '30+' },
            { label: 'Shitje Suksesshme', value: '5,000+' },
          ].map(stat => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-xs text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
