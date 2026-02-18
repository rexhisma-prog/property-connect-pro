import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Check, Star, Zap, AlertCircle, Building2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CreditPackage, ExtraPackage } from '@/lib/supabase-types';

export default function Pricing() {
  const [creditPkgs, setCreditPkgs] = useState<CreditPackage[]>([]);
  const [extraPkgs, setExtraPkgs] = useState<ExtraPackage[]>([]);

  useEffect(() => {
    supabase.from('credit_packages').select('*').eq('is_active', true).order('credits_amount')
      .then(({ data }) => setCreditPkgs((data as CreditPackage[]) || []));
    supabase.from('extra_packages').select('*').eq('is_active', true).order('price_eur')
      .then(({ data }) => setExtraPkgs((data as ExtraPackage[]) || []));
  }, []);

  const adPositions = [
    { name: 'Homepage Top Banner', price: '€79/muaj', desc: 'Dukshmëri maksimale - shfaqet mbi çdo gjë' },
    { name: 'Homepage Middle', price: '€49/muaj', desc: 'Seksioni i mesëm i faqes kryesore' },
    { name: 'Sidebar', price: '€29/muaj', desc: 'Shfaqet në faqen e listimit të pronave' },
    { name: 'Lista Pronave - Top', price: '€59/muaj', desc: 'Banner sipër listës së pronave' },
    { name: 'Detajet Pronës - Sidebar', price: '€39/muaj', desc: 'Shfaqet tek çdo pronë individual' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <div className="bg-foreground text-white py-16 text-center px-4">
          <h1 className="text-4xl font-bold mb-4">Çmimet & Paketat</h1>
          <p className="text-white/60 max-w-lg mx-auto">Gjithçka transparente. Pa pagesa të fshehura.</p>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-20">
          {/* Credit Packages */}
          <div>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground">Kredite Postimi</h2>
              <p className="text-muted-foreground mt-2">1 kredit = 1 postim prone aktiv për 90 ditë</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {creditPkgs.map(pkg => {
                const isBest = pkg.credits_amount === 4;
                return (
                  <div key={pkg.id} className={`relative bg-card border rounded-2xl p-5 text-center ${isBest ? 'border-primary shadow-lg ring-2 ring-primary/20' : 'border-border'}`}>
                    {isBest && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                        Vlera Më e Mirë
                      </div>
                    )}
                    <p className="text-4xl font-bold text-primary">{pkg.credits_amount}</p>
                    <p className="text-xs text-muted-foreground mb-3">{pkg.credits_amount === 1 ? 'kredit' : 'kredite'}</p>
                    <p className="text-2xl font-bold text-foreground">€{pkg.price_eur}</p>
                    <p className="text-xs text-muted-foreground mb-4">€{(pkg.price_eur / pkg.credits_amount).toFixed(0)}/kredit</p>
                    <Button className={`w-full text-sm ${isBest ? 'btn-orange' : ''}`} variant={isBest ? 'default' : 'outline'} asChild>
                      <Link to="/dashboard/credits">Blej</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Extra Packages */}
          <div>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground">Extras – Shto Dukshmëri</h2>
              <p className="text-muted-foreground mt-2">Rritni gjasat e shitjes me opsione premium</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {extraPkgs.map(pkg => {
                const icons: Record<string, any> = { featured: Star, boost: Zap, urgent: AlertCircle };
                const colors: Record<string, string> = { featured: 'text-amber-500', boost: 'text-blue-500', urgent: 'text-red-500' };
                const bgs: Record<string, string> = { featured: 'bg-amber-50', boost: 'bg-blue-50', urgent: 'bg-red-50' };
                const Icon = icons[pkg.type] || Star;
                return (
                  <div key={pkg.id} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 ${bgs[pkg.type]} rounded-lg flex items-center justify-center mb-3`}>
                      <Icon className={`w-5 h-5 ${colors[pkg.type]}`} />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">{pkg.name}</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      {pkg.type === 'featured' ? 'Pronë juaj shfaqet e para dhe me badge ⭐' :
                       pkg.type === 'boost' ? 'Ngritja menjëherë në krye të listës' :
                       'Badge URGENT që tërheq vëmendjen blerësve'}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-primary">€{pkg.price_eur}</p>
                      <Button size="sm" variant="outline" asChild className="text-xs">
                        <Link to="/dashboard/properties">Aktivizo</Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ad Positions */}
          <div>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground">Pozicionet e Reklamave</h2>
              <p className="text-muted-foreground mt-2">Për banka, kompani ndërtimi dhe sigurimesh</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {adPositions.map(pos => (
                <div key={pos.name} className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 hover:shadow-md transition-all">
                  <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mb-3">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1">{pos.name}</h3>
                  <p className="text-xs text-muted-foreground mb-4">{pos.desc}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-primary">{pos.price}</p>
                    <Button size="sm" className="btn-orange text-xs" asChild>
                      <Link to="/advertise">Reklamo</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
