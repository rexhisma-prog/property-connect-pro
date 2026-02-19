import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ExtraPackage, Property } from '@/lib/supabase-types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Loader2, Star, Zap, AlertCircle, ArrowLeft, CheckCircle, FlaskConical } from 'lucide-react';
import { toast } from 'sonner';

const typeConfig = {
  featured: {
    icon: Star,
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-500',
    badge: '⭐ Featured',
    badgeClass: 'bg-yellow-100 text-yellow-700',
    desc: 'Prona juaj shfaqet e para dhe me badge ⭐',
  },
  urgent: {
    icon: AlertCircle,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    badge: '🔴 Urgent',
    badgeClass: 'bg-red-100 text-red-700',
    desc: 'Badge URGENT që tërheq vëmendjen blerësve',
  },
  boost: {
    icon: Zap,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    badge: '⚡ Boost',
    badgeClass: 'bg-blue-100 text-blue-700',
    desc: 'Ngritja menjëherë në krye të listës',
  },
};

export default function PropertyExtras() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [property, setProperty] = useState<Property | null>(null);
  const [packages, setPackages] = useState<ExtraPackage[]>([]);
  const [testingMode, setTestingMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    if (!id || !user) return;
    Promise.all([
      supabase.from('properties').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
      supabase.from('extra_packages').select('*').eq('is_active', true).order('type').order('duration_days'),
      supabase.from('platform_settings').select('value').eq('key', 'testing_mode').maybeSingle(),
    ]).then(([propRes, pkgRes, settingRes]) => {
      if (!propRes.data) {
        toast.error('Prona nuk u gjet');
        navigate('/dashboard/properties');
        return;
      }
      setProperty(propRes.data as Property);
      setPackages((pkgRes.data as ExtraPackage[]) || []);
      setTestingMode(settingRes.data?.value === 'true');
      setLoading(false);
    });
  }, [id, user]);

  const isActive = (pkg: ExtraPackage) => {
    if (!property) return false;
    const now = new Date();
    if (pkg.type === 'featured') return property.is_featured && property.featured_until ? new Date(property.featured_until) > now : false;
    if (pkg.type === 'urgent') return property.is_urgent && property.urgent_until ? new Date(property.urgent_until) > now : false;
    return false; // boost has no expiry check
  };

  const handleActivate = async (pkg: ExtraPackage) => {
    if (!property || !user) return;

    if (!testingMode) {
      toast.info('Pagesa me Stripe do të aktivizohet së shpejti. Kontaktoni: marketing@shitepronen.com');
      return;
    }

    setActivating(pkg.id);
    try {
      const now = new Date();
      let updateData: Record<string, unknown> = {};

      if (pkg.type === 'featured') {
        const until = new Date(now);
        until.setDate(until.getDate() + pkg.duration_days);
        updateData = { is_featured: true, featured_until: until.toISOString() };
      } else if (pkg.type === 'urgent') {
        const until = new Date(now);
        until.setDate(until.getDate() + pkg.duration_days);
        updateData = { is_urgent: true, urgent_until: until.toISOString() };
      } else if (pkg.type === 'boost') {
        updateData = { last_boosted_at: now.toISOString() };
      }

      const { error } = await supabase
        .from('properties')
        .update(updateData)
        .eq('id', property.id)
        .eq('user_id', user.id);

      if (error) {
        toast.error('Gabim: ' + error.message);
        return;
      }

      // Log transaction
      await supabase.from('extra_transactions').insert({
        user_id: user.id,
        property_id: property.id,
        extra_package_id: pkg.id,
        amount_paid: testingMode ? 0 : pkg.price_eur,
        status: 'paid',
      });

      // Update local state
      setProperty(prev => prev ? { ...prev, ...updateData } as Property : prev);
      toast.success(`${pkg.name} u aktivizua me sukses! 🎉`);
    } catch {
      toast.error('Gabim i papritur.');
    } finally {
      setActivating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const grouped = {
    urgent: packages.filter(p => p.type === 'urgent'),
    featured: packages.filter(p => p.type === 'featured'),
    boost: packages.filter(p => p.type === 'boost'),
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Header */}
        <button
          onClick={() => navigate('/dashboard/properties')}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kthehu te Pronat
        </button>

        <div className="text-center mb-8">
          {testingMode && (
            <div className="inline-flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
              <FlaskConical className="w-3.5 h-3.5" /> Modalitet Testimi — Aktivizimi është falas
            </div>
          )}
          <h1 className="text-2xl font-bold text-foreground">Extras – Shto Dukshmëri</h1>
          <p className="text-muted-foreground mt-1">Rritni gjasat e shitjes me opsione premium</p>
          {property && (
            <p className="text-sm text-primary font-medium mt-2 truncate max-w-sm mx-auto">🏠 {property.title}</p>
          )}
        </div>

        {/* Package groups */}
        <div className="space-y-8">
          {(Object.entries(grouped) as [keyof typeof typeConfig, ExtraPackage[]][]).map(([type, pkgs]) => {
            if (!pkgs.length) return null;
            const cfg = typeConfig[type];
            const Icon = cfg.icon;

            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 ${cfg.iconBg} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-4 h-4 ${cfg.iconColor}`} />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground capitalize">{type === 'boost' ? 'Boost' : type.charAt(0).toUpperCase() + type.slice(1)}</h2>
                    <p className="text-xs text-muted-foreground">{cfg.desc}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pkgs.map(pkg => {
                    const active = isActive(pkg);
                    return (
                      <div
                        key={pkg.id}
                        className={`relative bg-card border rounded-2xl p-5 transition-all hover:shadow-md ${
                          active ? 'border-green-400 bg-green-50/30' : 'border-border'
                        }`}
                      >
                        {active && (
                          <div className="absolute -top-2.5 left-4">
                            <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Aktiv
                            </span>
                          </div>
                        )}

                        <div className={`w-10 h-10 ${cfg.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                          <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
                        </div>

                        <h3 className="font-semibold text-foreground text-sm mb-1">{pkg.name}</h3>
                        <p className="text-xs text-muted-foreground mb-4">{cfg.desc}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-primary">
                            {testingMode ? <span className="text-green-600 text-lg">Falas</span> : `€${pkg.price_eur}`}
                          </span>
                          <Button
                            size="sm"
                            variant={active ? 'secondary' : 'outline'}
                            disabled={activating === pkg.id || active}
                            onClick={() => handleActivate(pkg)}
                            className={!active && !activating ? 'hover:bg-primary hover:text-primary-foreground transition-colors' : ''}
                          >
                            {activating === pkg.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : active ? (
                              '✓ Aktiv'
                            ) : (
                              'Aktivizo'
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info */}
        {!testingMode && (
          <div className="mt-8 bg-secondary rounded-xl p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-1">ℹ️ Si funksionon pagesa?</p>
            <p>Pagesa processohet nëpërmjet Stripe. Pas pagesës, extra aktivizohet menjëherë automatikisht.</p>
            <p className="mt-1">Kontakti: <a href="mailto:marketing@shitepronen.com" className="text-primary hover:underline">marketing@shitepronen.com</a></p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
