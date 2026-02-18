import HeroSection from '@/components/HeroSection';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdBanner from '@/components/AdBanner';
import PropertyCard from '@/components/PropertyCard';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/lib/supabase-types';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Instagram } from 'lucide-react';

interface SocialPhoto {
  id: string;
  image_url: string;
  caption: string | null;
  link_url: string | null;
  sort_order: number;
}

export default function Index() {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [latestProperties, setLatestProperties] = useState<Property[]>([]);
  const [socialPhotos, setSocialPhotos] = useState<SocialPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const [featured, latest, photos] = await Promise.all([
      supabase.from('properties').select('*').eq('status', 'active').eq('is_featured', true)
        .gt('featured_until', new Date().toISOString()).order('created_at', { ascending: false }).limit(4),
      supabase.from('properties').select('*').eq('status', 'active')
        .order('last_boosted_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }).limit(8),
      supabase.from('social_photos').select('*').eq('is_active', true).order('sort_order', { ascending: true }).limit(12),
    ]);

    setFeaturedProperties((featured.data as Property[]) || []);
    setLatestProperties((latest.data as Property[]) || []);
    setSocialPhotos((photos.data as SocialPhoto[]) || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <HeroSection />

      {/* Banner: Homepage Top */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pt-6">
        <AdBanner position="homepage_top" className="w-full" />
      </div>

      {/* Featured */}
      {(featuredProperties.length > 0 || loading) && (
        <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="section-title flex items-center gap-2">
                ⭐ Prona Featured
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Pronat me dukshmëri të lartë</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/properties?featured=true" className="gap-1.5">Shiko të gjitha <ArrowRight className="w-3.5 h-3.5" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="property-card animate-pulse">
                <div className="h-52 bg-secondary" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-secondary rounded" />
                  <div className="h-3 bg-secondary rounded w-2/3" />
                </div>
              </div>
            )) : featuredProperties.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
        </section>
      )}

      {/* Latest Listings */}
      <section className="py-14 bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="section-title">🏠 Prona të Reja</h2>
              <p className="text-muted-foreground text-sm mt-1">Listuar rishtas nga shitësit</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/properties" className="gap-1.5">Shiko të gjitha <ArrowRight className="w-3.5 h-3.5" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {loading ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="property-card animate-pulse">
                <div className="h-52 bg-secondary" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-border rounded" />
                  <div className="h-3 bg-border rounded w-2/3" />
                </div>
              </div>
            )) : latestProperties.map(p => <PropertyCard key={p.id} property={p} />)}
          </div>
          {latestProperties.length === 0 && !loading && (
            <div className="text-center py-12">
              <p className="text-3xl mb-3">🏠</p>
              <p className="text-muted-foreground">Ende nuk ka prona aktive. Jini i pari!</p>
              <Button className="mt-4 btn-orange" asChild>
                <Link to="/register">Regjistrohu & Posto Pronë</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* How it works */}
      {/* Banner: Homepage Middle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <AdBanner position="homepage_middle" className="w-full" />
      </div>

      {/* Placeholder: Banesat & Shtëpitë - do të shtohet më vonë */}


      {/* Social Photos Gallery */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title flex items-center gap-2">
              <Instagram className="w-5 h-5 text-primary" /> Galeria Jonë
            </h2>
            <p className="text-muted-foreground text-sm mt-1">Prona të zgjedhura nga rrjetet sociale</p>
          </div>
        </div>
        {socialPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {socialPhotos.map(photo => (
              photo.link_url ? (
                <a key={photo.id} href={photo.link_url} target="_blank" rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-xl bg-secondary block">
                  <img src={photo.image_url} alt={photo.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {photo.caption && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                      <p className="text-white text-xs p-3 opacity-0 group-hover:opacity-100 transition-opacity font-medium">{photo.caption}</p>
                    </div>
                  )}
                </a>
              ) : (
                <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl bg-secondary">
                  <img src={photo.image_url} alt={photo.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {photo.caption && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end">
                      <p className="text-white text-xs p-3 opacity-0 group-hover:opacity-100 transition-opacity font-medium">{photo.caption}</p>
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        ) : !loading ? (
          <div className="text-center py-16 bg-secondary/30 rounded-2xl border border-dashed border-border">
            <Instagram className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Fotografitë do të shfaqen këtu</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Shto foto nga paneli i adminit</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-secondary animate-pulse" />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
