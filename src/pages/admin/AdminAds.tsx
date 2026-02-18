import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Check, X, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminAds() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchAds(); }, [filter]);

  const fetchAds = async () => {
    let query = supabase.from('ads').select('*, ad_positions(display_name)').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter as 'active' | 'expired' | 'pending' | 'rejected');
    const { data } = await query;
    setAds(data || []);
    setLoading(false);
  };

  const approveAd = async (id: string) => {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await supabase.from('ads').update({
      status: 'active',
      start_date: now.toISOString(),
      end_date: end.toISOString(),
    }).eq('id', id);
    toast.success('Reklama u aprovua');
    fetchAds();
  };

  const setAdCountry = async (id: string, country: string | null) => {
    await supabase.from('ads').update({ country } as any).eq('id', id);
    toast.success('Vendi u përditësua');
    fetchAds();
  };

  const rejectAd = async (id: string) => {
    await supabase.from('ads').update({ status: 'rejected' }).eq('id', id);
    toast.success('Reklama u refuzua');
    fetchAds();
  };

  const statusStyle: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    expired: 'bg-gray-100 text-gray-600',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <AdminLayout title="Menaxhimi i Reklamave">
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', 'pending', 'active', 'expired', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
            }`}>
            {f === 'all' ? 'Të gjitha' : f === 'pending' ? 'Në pritje' : f === 'active' ? 'Aktive' : f === 'expired' ? 'Skaduar' : 'Refuzuar'}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                {['Reklamues', 'Titulli', 'Pozicioni', 'Vendi', 'Media', 'Statusi', 'Data', 'Veprime'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-secondary rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : ads.map(ad => (
                <tr key={ad.id} className="hover:bg-secondary/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{ad.advertiser_name}</p>
                    <p className="text-xs text-muted-foreground">{ad.advertiser_email}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">{ad.title}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{ad.ad_positions?.display_name || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={ad.country || ''}
                      onChange={e => setAdCountry(ad.id, e.target.value || null)}
                      className="text-xs border border-border rounded-lg px-2 py-1 bg-background focus:outline-none"
                    >
                      <option value="">🌍 Të gjitha</option>
                      <option value="kosovo">🇽🇰 Kosovë</option>
                      <option value="albania">🇦🇱 Shqipëri</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {ad.media_url ? (
                      <a href={ad.media_url} target="_blank" className="text-primary text-xs underline flex items-center gap-1">
                        <Eye className="w-3 h-3" /> Shiko
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[ad.status] || ''}`}>
                      {ad.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(ad.created_at).toLocaleDateString('sq-AL')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {ad.status === 'pending' && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-green-600 border-green-200"
                            onClick={() => approveAd(ad.id)}>
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 px-2 text-destructive border-red-200"
                            onClick={() => rejectAd(ad.id)}>
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      {ad.status === 'active' && (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-destructive"
                          onClick={() => rejectAd(ad.id)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ads.length === 0 && !loading && (
          <div className="text-center py-10 text-muted-foreground">Nuk ka reklama</div>
        )}
      </div>
    </AdminLayout>
  );
}
