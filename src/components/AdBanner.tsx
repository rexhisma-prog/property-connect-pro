import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink } from 'lucide-react';
import { useCountry } from '@/contexts/CountryContext';

interface Ad {
  id: string;
  title: string;
  media_url: string | null;
  media_type: 'image' | 'video';
  link_url: string | null;
  advertiser_name: string;
  size: string;
}

interface AdBannerProps {
  position: 'homepage_top' | 'homepage_middle' | 'sidebar' | 'property_list_top' | 'property_details_sidebar';
  className?: string;
}

// 5 preset sizes available to admin
export const AD_SIZES: Record<string, { label: string; w: number; h: number }> = {
  leaderboard: { label: '📏 Leaderboard (720×90)',     w: 720, h: 90  },
  banner:      { label: '🖼️ Banner i Madh (720×300)',  w: 720, h: 300 },
  rectangle:   { label: '⬜ Rectangle (300×250)',       w: 300, h: 250 },
  halfpage:    { label: '📰 Gjysmë Faqe (300×600)',    w: 300, h: 600 },
  skyscraper:  { label: '🏙️ Skyscraper (160×600)',     w: 160, h: 600 },
};

export default function AdBanner({ position, className = '' }: AdBannerProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { country } = useCountry();

  useEffect(() => {
    fetchAd();
  }, [position, country]);

  const fetchAd = async () => {
    const { data: pos } = await supabase
      .from('ad_positions')
      .select('id')
      .eq('name', position)
      .eq('is_active', true)
      .single();

    if (!pos) { setLoaded(true); return; }

    const now = new Date().toISOString();
    let query = supabase
      .from('ads')
      .select('id, title, media_url, media_type, link_url, advertiser_name, country, size')
      .eq('position_id', pos.id)
      .eq('status', 'active')
      .lte('start_date', now)
      .gte('end_date', now);

    if (country) {
      query = (query as any).or(`country.eq.${country},country.is.null`);
    }

    const { data } = await query.limit(1).maybeSingle();

    if (data) {
      setAd(data as Ad);
      await supabase.from('ad_events').insert({ ad_id: data.id, event_type: 'impression' });
    } else {
      setAd(null);
    }
    setLoaded(true);
  };

  const handleClick = async () => {
    if (!ad) return;
    await supabase.from('ad_events').insert({ ad_id: ad.id, event_type: 'click' });
    if (ad.link_url) window.open(ad.link_url, '_blank', 'noopener noreferrer');
  };

  const sizeKey = ad?.size && AD_SIZES[ad.size] ? ad.size : 'leaderboard';
  const dims = AD_SIZES[sizeKey];

  const containerStyle: React.CSSProperties = {
    width: dims.w,
    height: dims.h,
    maxWidth: '100%',
  };

  if (!loaded) return null;

  if (!ad) return (
    <div
      style={containerStyle}
      className={`relative overflow-hidden rounded-xl border-2 border-orange-500 bg-orange-500 flex items-center justify-center mx-auto ${className}`}
    >
      <a href="/advertise" className="text-center group flex flex-col items-center gap-1">
        <p className="text-white font-bold group-hover:text-white/80 transition-colors">📢 Reklamo Këtu</p>
        <p className="text-white/80 text-xs font-mono">{dims.w} × {dims.h} px</p>
      </a>
    </div>
  );

  return (
    <div
      style={containerStyle}
      className={`relative group overflow-hidden rounded-xl border border-border bg-secondary/30 mx-auto ${className}`}
    >
      <div className="absolute top-1 left-2 z-10 bg-black/60 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider">
        Reklama
      </div>

      <div
        onClick={handleClick}
        className={`cursor-pointer block w-full h-full ${ad.link_url ? 'hover:opacity-95 transition-opacity' : ''}`}
      >
        {ad.media_url ? (
          ad.media_type === 'video' ? (
            <video src={ad.media_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
          ) : (
            <img src={ad.media_url} alt={ad.title} className="w-full h-full object-cover" />
          )
        ) : (
          <div className="flex items-center justify-center bg-gradient-to-r from-primary/10 to-accent w-full h-full">
            <div className="text-center px-4">
              <p className="font-bold text-foreground text-lg">{ad.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{ad.advertiser_name}</p>
              {ad.link_url && (
                <span className="inline-flex items-center gap-1 text-primary text-xs mt-2 font-medium">
                  Mëso më shumë <ExternalLink className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        )}

        {ad.link_url && ad.media_url && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-end p-3">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
              {ad.advertiser_name} <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
