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
import { ArrowRight, Shield, Zap, CreditCard, TrendingUp } from 'lucide-react';

export default function Index() {
  const [featuredProperties, setFeaturedProperties] = useState<Property[]>([]);
  const [latestProperties, setLatestProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    const [featured, latest] = await Promise.all([
      supabase.from('properties').select('*').eq('status', 'active').eq('is_featured', true)
        .gt('featured_until', new Date().toISOString()).order('created_at', { ascending: false }).limit(4),
      supabase.from('properties').select('*').eq('status', 'active')
        .order('last_boosted_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }).limit(8),
    ]);

    setFeaturedProperties((featured.data as Property[]) || []);
    setLatestProperties((latest.data as Property[]) || []);
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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

      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        <div className="text-center mb-12">
          <h2 className="section-title text-3xl">Si funksionon?</h2>
          <p className="text-muted-foreground mt-2">3 hapa të thjeshtë për të shitur pronën tuaj</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              icon: '👤',
              step: '1',
              title: 'Regjistrohu Falas',
              desc: 'Krijoni llogarinë tuaj me email ose Google në pak sekonda.'
            },
            {
              icon: '💳',
              step: '2',
              title: 'Blej Kredite',
              desc: 'Zgjidhni paketën e krediteve që ju nevojitet. 1 kredit = 1 postim 90-ditor.'
            },
            {
              icon: '🏠',
              step: '3',
              title: 'Posto & Shit',
              desc: 'Listoni pronën me foto, përshkrim dhe çmim. Blerësit ju kontaktojnë direkt.'
            },
          ].map(item => (
            <div key={item.step} className="text-center group">
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="inline-flex items-center justify-center w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold mb-3">
                {item.step}
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-foreground text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Pse ShitëPronen.com?</h2>
            <p className="text-white/60">Platforma e ndërtuar për tregun shqiptar të pronave</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: 'I Sigurt', desc: 'RLS Security në çdo nivel' },
              { icon: Zap, title: 'I Shpejtë', desc: 'Postim pronë në 2 minuta' },
              { icon: CreditCard, title: 'Çmime të Ulëta', desc: 'Nga €25 për postim' },
              { icon: TrendingUp, title: 'Statistika', desc: 'Shikimet & kontaktet live' },
            ].map(f => (
              <div key={f.title} className="text-center">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-white/50 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 text-center w-full">
        <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
          Gati të filloni?
        </h2>
        <p className="text-muted-foreground text-lg mb-8">
          Regjistrohu falas dhe postoni pronën tuaj të parë sot.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="btn-orange px-8" asChild>
            <Link to="/register">Regjistrohu Falas</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/properties">Shiko Pronat</Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
