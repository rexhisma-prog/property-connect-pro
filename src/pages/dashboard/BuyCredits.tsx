import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CreditPackage } from '@/lib/supabase-types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { CreditCard, Check, Zap, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function BuyCredits() {
  const { profile } = useAuth();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('credit_packages').select('*').eq('is_active', true).order('credits_amount')
      .then(({ data }) => {
        setPackages((data as CreditPackage[]) || []);
        setLoading(false);
      });
  }, []);

  const handleBuy = async (pkg: CreditPackage) => {
    setBuying(pkg.id);
    // In production, this would redirect to Stripe
    toast.info('Integrimi me Stripe do të aktivizohet së shpejti. Kontaktoni: marketing@shitepronen.com');
    setBuying(null);
  };

  const getBestValue = (credits: number) => credits >= 4;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-accent px-4 py-1.5 rounded-full text-primary text-sm font-medium mb-4">
            <CreditCard className="w-4 h-4" /> Kredite Postimi
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Blej Kredite</h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            1 kredit = 1 postim prone aktiv për 90 ditë. Zgjidhni paketën që ju përshtatet.
          </p>
          {profile && (
            <div className="inline-block mt-4 bg-accent text-primary font-semibold text-sm px-4 py-2 rounded-full">
              Kreditet tuaja: {profile.credits_remaining}
            </div>
          )}
        </div>

        {/* Packages */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1,2,3].map(i => <div key={i} className="h-48 bg-secondary rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {packages.map(pkg => {
              const perCredit = (pkg.price_eur / pkg.credits_amount).toFixed(0);
              const isBest = getBestValue(pkg.credits_amount);
              return (
                <div
                  key={pkg.id}
                  className={`relative bg-card border rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-lg ${
                    isBest ? 'border-primary shadow-md' : 'border-border'
                  }`}
                >
                  {isBest && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3 h-3" /> Vlera Më e Mirë
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold text-primary">{pkg.credits_amount}</p>
                    <p className="text-sm text-muted-foreground">{pkg.credits_amount === 1 ? 'kredit' : 'kredite'}</p>
                  </div>

                  <div className="text-center mb-6">
                    <p className="text-3xl font-bold text-foreground">€{pkg.price_eur}</p>
                    <p className="text-xs text-muted-foreground">€{perCredit}/kredit</p>
                  </div>

                  <ul className="space-y-2 mb-6">
                    {[
                      `${pkg.credits_amount} postim${pkg.credits_amount > 1 ? 'e' : ''} aktiv`,
                      'Aktiv për 90 ditë secili',
                      'Statistika falas',
                      'Pagesë e sigurt Stripe',
                    ].map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${isBest ? 'btn-orange' : ''}`}
                    variant={isBest ? 'default' : 'outline'}
                    disabled={buying === pkg.id}
                    onClick={() => handleBuy(pkg)}
                  >
                    {buying === pkg.id ? 'Duke procesuar...' : `Blej për €${pkg.price_eur}`}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Info */}
        <div className="mt-10 bg-secondary rounded-xl p-5">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" /> Si funksionon?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '1', title: 'Blej kredite', desc: 'Paguani me kartë bankare nëpërmjet Stripe të sigurt' },
              { step: '2', title: 'Posto pronën', desc: 'Çdo postim konsumon 1 kredit dhe është aktiv 90 ditë' },
              { step: '3', title: 'Merr kontakte', desc: 'Blerësit kontaktojnë drejtpërdrejt nëpërmjet platformës' },
            ].map(s => (
              <div key={s.step} className="flex gap-3">
                <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="font-medium text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
