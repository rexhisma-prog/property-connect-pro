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
  Heart, ChevronLeft, ChevronRight
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
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [contactPhone, setContactPhone] = useState('');
  const [showPhone, setShowPhone] = useState(false);

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
          {/* Breadcrumb */}
          <button onClick={() => navigate('/properties')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kthehu te lista
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Images + Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="relative rounded-2xl overflow-hidden bg-secondary h-[400px]">
                {property.images && property.images.length > 0 ? (
                  <>
                    <img
                      src={property.images[currentImage]}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                    {property.images.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentImage(i => (i - 1 + property.images.length) % property.images.length)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setCurrentImage(i => (i + 1) % property.images.length)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {property.images.map((_, i) => (
                            <button key={i} onClick={() => setCurrentImage(i)}
                              className={`w-2 h-2 rounded-full transition-all ${i === currentImage ? 'bg-white w-4' : 'bg-white/50'}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-7xl">🏠</span>
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {isActiveFeatured && <span className="badge-featured flex items-center gap-1"><Star className="w-3 h-3" /> Featured</span>}
                  {isActiveUrgent && <span className="badge-urgent flex items-center gap-1"><Zap className="w-3 h-3" /> Urgent</span>}
                </div>
              </div>

              {/* Thumbnails */}
              {property.images && property.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {property.images.map((img, i) => (
                    <button key={i} onClick={() => setCurrentImage(i)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${i === currentImage ? 'border-primary' : 'border-transparent'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
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
                        {property.property_type === 'apartment' ? 'Apartament' : 
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

                <div className="space-y-3">
                  {/* Phone */}
                  <Button
                    className="w-full btn-orange gap-2"
                    onClick={() => {
                      setShowPhone(true);
                      handleContactClick('phone_click');
                    }}
                  >
                    <Phone className="w-4 h-4" />
                    {showPhone ? '+383 44 XXX XXX' : 'Shiko Numrin'}
                  </Button>

                  {/* WhatsApp */}
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-green-600 text-green-700 hover:bg-green-50"
                    onClick={() => {
                      handleContactClick('whatsapp_click');
                      window.open(`https://wa.me/38344000000?text=Jam i interesuar për: ${property.title}`, '_blank');
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
                      window.open(`mailto:?subject=Interesim për pronën: ${property.title}`, '_blank');
                    }}
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                </div>

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
