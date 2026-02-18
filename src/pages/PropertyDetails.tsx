import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdBanner from '@/components/AdBanner';
import { supabase } from '@/integrations/supabase/client';
import { Property } from '@/lib/supabase-types';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MapPin, BedDouble, Bath, Maximize2, Eye, Phone, Mail, 
  MessageCircle, Star, Zap, ArrowLeft, Calendar, Share2,
  ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { toast } from 'sonner';

function formatPrice(price: number, currency: string = 'EUR') {
  return new Intl.NumberFormat('sq-AL', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);
}

export default function PropertyDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [ownerPhone, setOwnerPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [showPhone, setShowPhone] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    const { data } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id!)
      .single();

    if (data) {
      setProperty(data as Property);
      // Fetch owner phone
      const { data: owner } = await supabase
        .from('users')
        .select('phone')
        .eq('id', data.user_id)
        .single();
      if (owner?.phone) setOwnerPhone(owner.phone);
      // Track view
      await supabase.from('property_events').insert({
        property_id: id!,
        event_type: 'view',
        user_id: user?.id || null,
      });
    }
    setLoading(false);
  };

  const handleContactClick = async (type: 'phone_click' | 'whatsapp_click' | 'email_click') => {
    await supabase.from('property_events').insert({
      property_id: id!,
      event_type: type,
      user_id: user?.id || null,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-center px-4">
          <div>
            <p className="text-5xl mb-4">🏚️</p>
            <h1 className="text-xl font-bold mb-2">Prona nuk u gjet</h1>
            <Button onClick={() => navigate('/properties')}>Kthehu te Prona</Button>
          </div>
        </div>
      </div>
    );
  }

  const isActiveFeatured = property.is_featured && property.featured_until && new Date(property.featured_until) > new Date();
  const isActiveUrgent = property.is_urgent && property.urgent_until && new Date(property.urgent_until) > new Date();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Images + Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery — Hero + Thumbnail Strip */}
              {property.images && property.images.length > 0 ? (
                <div className="space-y-2">
                  {/* Hero Image */}
                  <div className="relative rounded-2xl overflow-hidden bg-secondary h-[420px] sm:h-[500px] cursor-pointer group"
                    onClick={() => setLightboxOpen(true)}
                  >
                    <img
                      src={property.images[currentImage]}
                      alt={property.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />

                    {/* Top bar: back + share */}
                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                      <button
                        onClick={e => { e.stopPropagation(); navigate('/properties'); }}
                        className="w-9 h-9 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div className="flex gap-2">
                        {isActiveFeatured && <span className="badge-featured flex items-center gap-1"><Star className="w-3 h-3" /> Featured</span>}
                        {isActiveUrgent && <span className="badge-urgent flex items-center gap-1"><Zap className="w-3 h-3" /> Urgent</span>}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(window.location.href); toast.success('Linku u kopjua!'); }}
                        className="w-9 h-9 bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Nav arrows */}
                    {property.images.length > 1 && (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); setCurrentImage(i => (i - 1 + property.images!.length) % property.images!.length); }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 backdrop-blur-sm hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); setCurrentImage(i => (i + 1) % property.images!.length); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-black/40 backdrop-blur-sm hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}

                    {/* Counter pill */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-medium">
                      {currentImage + 1} / {property.images.length}
                    </div>
                  </div>

                  {/* Thumbnail Strip */}
                  {property.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                      {property.images.slice(0, 5).map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImage(i)}
                          className={`relative flex-shrink-0 w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${i === currentImage ? 'border-primary scale-[1.03]' : 'border-transparent opacity-70 hover:opacity-100'}`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                          {/* "+N more" overlay on last visible thumb */}
                          {i === 4 && property.images!.length > 5 && (
                            <div
                              onClick={e => { e.stopPropagation(); setLightboxOpen(true); }}
                              className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm font-bold"
                            >
                              +{property.images!.length - 5}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden bg-secondary h-[420px] flex items-center justify-center">
                  <span className="text-7xl">🏠</span>
                </div>
              )}

              {/* Lightbox */}
              {lightboxOpen && property.images && property.images.length > 0 && (
                <div
                  className="fixed inset-0 z-50 flex flex-col bg-black"
                  onClick={() => setLightboxOpen(false)}
                >
                  {/* Lightbox header */}
                  <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <span className="text-white/70 text-sm font-medium">{currentImage + 1} / {property.images.length}</span>
                    <button
                      className="w-9 h-9 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center"
                      onClick={() => setLightboxOpen(false)}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Main image */}
                  <div className="flex-1 flex items-center justify-center relative" onClick={e => e.stopPropagation()}>
                    {property.images.length > 1 && (
                      <>
                        <button
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center z-10"
                          onClick={() => setCurrentImage(i => (i - 1 + property.images!.length) % property.images!.length)}
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center z-10"
                          onClick={() => setCurrentImage(i => (i + 1) % property.images!.length)}
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}
                    <img
                      src={property.images[currentImage]}
                      alt={property.title}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  {/* Lightbox thumbnail strip */}
                  {property.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto px-4 py-3 flex-shrink-0 scrollbar-hide" onClick={e => e.stopPropagation()}>
                      {property.images.map((img, i) => (
                        <button key={i} onClick={() => setCurrentImage(i)}
                          className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${i === currentImage ? 'border-primary' : 'border-white/20 opacity-60 hover:opacity-100'}`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Title + Price */}
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={property.listing_type === 'shitje' ? 'bg-primary text-primary-foreground' : 'bg-green-600 text-white'}>
                        {property.listing_type === 'shitje' ? 'Shitje' : 'Me Qira'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {property.property_type === 'apartment' ? 'Banesë' : 
                         property.property_type === 'house' ? 'Shtëpi' :
                         property.property_type === 'land' ? 'Tokë' : 'Lokal'}
                      </Badge>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{property.title}</h1>
                    <div className="flex items-center gap-1.5 text-muted-foreground mt-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <span>{property.city}{property.address ? `, ${property.address}` : ''}</span>
                    </div>
                  </div>
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground p-2 rounded-lg border border-border" onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success('Linku u kopjua!');
                  }}>
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-3xl font-bold text-primary mt-4">
                  {formatPrice(property.price, property.currency)}
                  {property.listing_type === 'qira' && <span className="text-base text-muted-foreground font-normal">/muaj</span>}
                </p>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-secondary rounded-xl">
                {property.bedrooms && (
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Dhoma gjumi</p>
                      <p className="font-semibold">{property.bedrooms}</p>
                    </div>
                  </div>
                )}
                {property.bathrooms && (
                  <div className="flex items-center gap-2">
                    <Bath className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Banjo</p>
                      <p className="font-semibold">{property.bathrooms}</p>
                    </div>
                  </div>
                )}
                {property.area_m2 && (
                  <div className="flex items-center gap-2">
                    <Maximize2 className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Sipërfaqja</p>
                      <p className="font-semibold">{property.area_m2}m²</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Shikimet</p>
                    <p className="font-semibold">{property.views_count}</p>
                  </div>
                </div>
              </div>

              {/* Badges ligjore — varësisht nga lloji i pronës */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Pranim Teknik + Fletë Poseduese — apartment/house/commercial me shitje */}
                {(property.property_type === 'apartment' || property.property_type === 'house' || property.property_type === 'commercial') && property.listing_type === 'shitje' && (
                  <>
                    {(property as any).has_pranim_teknik ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1">✓ Ka Pranim Teknik</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground border border-border bg-secondary rounded-full px-3 py-1">✗ Pa Pranim Teknik</span>
                    )}
                    {(property as any).has_flete_poseduese ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1">✓ Ka Fletë Poseduese</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground border border-border bg-secondary rounded-full px-3 py-1">✗ Pa Fletë Poseduese</span>
                    )}
                  </>
                )}

                {/* Tokë — parcelë dhe leje ndërtimi */}
                {property.property_type === 'land' && (
                  <>
                    {(property as any).is_parcele ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1">
                        ✓ E listuar si Parcelë
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground border border-border bg-secondary rounded-full px-3 py-1">
                        ✗ Pa Regjistrim Parcele
                      </span>
                    )}
                    {(property as any).has_leje_ndertimi ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary border border-primary/30 bg-primary/10 rounded-full px-3 py-1">
                        ✓ Ka Leje Ndërtimi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground border border-border bg-secondary rounded-full px-3 py-1">
                        ✗ Pa Leje Ndërtimi
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Description */}
              {property.description && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">Përshkrimi</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{property.description}</p>
                </div>
              )}

              {/* Posted Date */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Postuar: {new Date(property.created_at).toLocaleDateString('sq-AL')}
                {property.expires_at && (
                  <> · Skadon: {new Date(property.expires_at).toLocaleDateString('sq-AL')}</>
                )}
              </div>
            </div>

            {/* Right: Contact Card + Sidebar Ad */}
            <div className="space-y-4">
              <AdBanner position="property_details_sidebar" className="w-full" />
              <div className="bg-card border border-border rounded-2xl p-5 sticky top-24 shadow-md">
                <h3 className="font-semibold text-lg mb-4">Kontaktoni Shitësin</h3>

                {!user ? (
                  /* Not logged in - prompt to register */
                  <div className="space-y-3">
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center">
                      <Phone className="w-8 h-8 text-primary mx-auto mb-2" />
                      <p className="font-medium text-foreground text-sm mb-1">Kërkohet Llogaria</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Regjistrohu me Gmail për të parë numrin e telefonit dhe kontaktuar pronarin.
                      </p>
                      <Button className="w-full btn-orange gap-2 mb-2" onClick={() => navigate('/register')}>
                        Regjistrohu me Gmail
                      </Button>
                      <Button variant="outline" className="w-full text-sm" onClick={() => navigate('/login')}>
                        Kam llogari — Hyr
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Phone */}
                    {showPhone && ownerPhone ? (
                      <a href={`tel:${ownerPhone}`} className="block w-full">
                        <Button className="w-full btn-orange gap-2">
                          <Phone className="w-4 h-4" />
                          {ownerPhone}
                        </Button>
                      </a>
                    ) : (
                      <Button
                        className="w-full btn-orange gap-2"
                        onClick={() => {
                          setShowPhone(true);
                          handleContactClick('phone_click');
                        }}
                      >
                        <Phone className="w-4 h-4" />
                        {ownerPhone ? 'Shiko Numrin' : 'Nuk ka numër'}
                      </Button>
                    )}

                    {/* WhatsApp */}
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-green-600 text-green-700 hover:bg-green-50"
                      onClick={() => {
                        handleContactClick('whatsapp_click');
                        const phone = ownerPhone ? ownerPhone.replace(/\D/g, '') : '';
                        window.open(`https://wa.me/${phone}?text=Jam i interesuar për: ${encodeURIComponent(property.title)}`, '_blank');
                      }}
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </Button>

                    {/* Email */}
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => {
                        handleContactClick('email_click');
                        window.open(`mailto:?subject=${encodeURIComponent('Interesim për pronën: ' + property.title)}`, '_blank');
                      }}
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </Button>
                  </div>
                )}

                <div className="mt-4 p-3 bg-secondary rounded-xl">
                  <p className="text-xs text-muted-foreground">
                    ⚠️ Kujdes nga mashtrimet. Mos transferoni para pa parë pronën personalisht.
                  </p>
                </div>
              </div>

              {/* Property ID */}
              <div className="text-xs text-muted-foreground text-center">
                ID: {property.id.slice(0, 8).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
