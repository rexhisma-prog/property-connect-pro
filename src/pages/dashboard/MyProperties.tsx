import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/lib/supabase-types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, Star, Zap, CheckCircle, Phone, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

function formatPrice(price: number) {
  return new Intl.NumberFormat('sq-AL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(price);
}

const statusConfig = {
  draft: { label: 'Draft', variant: 'secondary' as const },
  active: { label: 'Aktive', variant: 'default' as const },
  blocked: { label: 'Bllokuar', variant: 'destructive' as const },
  sold: { label: 'Shitur', variant: 'secondary' as const },
  rented: { label: 'Qiradhënë', variant: 'secondary' as const },
  archived: { label: 'Arkivuar', variant: 'secondary' as const },
};

export default function MyProperties() {
  const { user, profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchProperties();
  }, [user]);

  const fetchProperties = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setProperties((data as Property[]) || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Jeni i sigurt që doni ta fshini këtë pronë?')) return;
    await supabase.from('properties').delete().eq('id', id);
    setProperties(prev => prev.filter(p => p.id !== id));
    toast.success('Prona u fshi');
  };

  const handlePublish = async (property: Property) => {
    if ((profile?.credits_remaining ?? 0) <= 0) {
      toast.error('Nuk keni kredite! Blini kredite për të publikuar.');
      return;
    }

    // Check for keywords
    const text = `${property.title} ${property.description || ''}`.toLowerCase();
    const { data: keywords } = await supabase.from('blocked_keywords').select('keyword').eq('is_active', true);
    const matched = keywords?.find(k => text.includes(k.keyword.toLowerCase()));
    
    if (matched) {
      await supabase.from('users').update({ status: 'blocked' }).eq('id', user!.id);
      await supabase.from('properties').update({ status: 'blocked' }).eq('id', property.id);
      await supabase.from('agency_flags').insert({
        user_id: user!.id,
        property_id: property.id,
        reason: 'Keyword detected during publish',
        matched_keyword: matched.keyword,
      });
      toast.error('Llogaria u bllokua për shkak të dyshimit për postim agjencioni. Kontakto support.');
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    await supabase.from('properties').update({
      status: 'active',
      expires_at: expiresAt.toISOString(),
    }).eq('id', property.id);

    // Deduct credit
    await supabase.from('users').update({ 
      credits_remaining: (profile!.credits_remaining - 1) 
    }).eq('id', user!.id);

    toast.success('Prona u publikua!');
    fetchProperties();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pronat e Mia</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Kredite: <span className="text-primary font-semibold">{profile?.credits_remaining}</span>
            </p>
          </div>
          <Button asChild className="btn-orange gap-1.5">
            <Link to="/dashboard/properties/new">
              <Plus className="w-4 h-4" /> Shto Pronë
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-secondary rounded-xl animate-pulse" />)}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-16 bg-card border border-border rounded-2xl">
            <p className="text-4xl mb-3">🏠</p>
            <h2 className="font-semibold text-lg mb-1">Nuk keni prona</h2>
            <p className="text-muted-foreground text-sm mb-4">Postoni pronën tuaj të parë tani</p>
            <Button asChild className="btn-orange">
              <Link to="/dashboard/properties/new"><Plus className="w-4 h-4 mr-1.5" /> Posto Pronë</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {properties.map(property => {
              const sc = statusConfig[property.status] || statusConfig.draft;
              return (
                <div key={property.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex gap-4 p-4">
                    {/* Image */}
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-secondary">
                      {property.images?.[0] ? (
                        <img src={property.images[0]} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground text-sm truncate">{property.title}</h3>
                        <Badge variant={sc.variant} className="flex-shrink-0 text-xs">{sc.label}</Badge>
                      </div>
                      <p className="text-primary font-bold mt-1">{formatPrice(property.price)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{property.city}</p>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground bg-secondary border border-border rounded-lg px-2 py-1">
                          <Eye className="w-3.5 h-3.5 text-primary" />
                          {property.views_count} shikime
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground bg-secondary border border-border rounded-lg px-2 py-1">
                          <Phone className="w-3.5 h-3.5 text-primary" />
                          {property.contacts_count} kontakte
                        </span>
                      </div>

                      <div className="flex items-center gap-1 mt-1.5">
                        {property.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary border border-primary/30 bg-primary/10 rounded-full px-2 py-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                            Aktive
                          </span>
                        ) : null}
                        {property.is_featured && <span className="badge-featured text-xs flex items-center gap-1"><Star className="w-2.5 h-2.5" />Featured</span>}
                        {property.is_urgent && <span className="badge-urgent text-xs flex items-center gap-1"><Zap className="w-2.5 h-2.5" />Urgent</span>}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      {property.status === 'draft' && (
                        <Button size="sm" variant="default" className="btn-orange text-xs h-7 px-2 gap-1" onClick={() => handlePublish(property)}>
                          <CheckCircle className="w-3 h-3" /> Publiko
                        </Button>
                      )}
                      <Button size="sm" variant="outline" asChild className="text-xs h-7 px-2 gap-1">
                        <Link to={`/dashboard/properties/${property.id}/edit`}>
                          <Edit className="w-3 h-3" /> Edito
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-xs h-7 px-2 gap-1 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(property.id)}>
                        <Trash2 className="w-3 h-3" /> Fshi
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
