import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Check, X, Eye, Plus, Trash2, Upload, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { AD_SIZES } from '@/components/AdBanner';


interface AdPosition { id: string; name: string; display_name: string; }

const emptyForm = {
  title: '', advertiser_name: '', advertiser_email: '',
  media_url: '', link_url: '', country: '', position_id: '',
  media_type: 'image' as 'image' | 'video',
  size: 'leaderboard',
};

export default function AdminAds() {
  const [ads, setAds] = useState<any[]>([]);
  const [positions, setPositions] = useState<AdPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchAds();
    fetchPositions();
  }, [filter]);

  const fetchPositions = async () => {
    const { data } = await supabase.from('ad_positions').select('id, name, display_name').eq('is_active', true);
    setPositions(data || []);
  };

  const fetchAds = async () => {
    setLoading(true);
    let query = supabase.from('ads').select('*, ad_positions(display_name)').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter as any);
    const { data } = await query;
    setAds(data || []);
    setLoading(false);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const filename = `ad_${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from('ad-media').upload(filename, file, { upsert: true });
    setUploading(false);
    if (error) { toast.error('Gabim në ngarkimin e fotos'); return; }
    const { data: urlData } = supabase.storage.from('ad-media').getPublicUrl(filename);
    setForm(p => ({ ...p, media_url: urlData.publicUrl }));
    toast.success('Foto u ngarkua!');
  };

  const openForm = (ad?: any) => {
    if (ad) {
      setEditingId(ad.id);
      setForm({
        title: ad.title || '',
        advertiser_name: ad.advertiser_name || '',
        advertiser_email: ad.advertiser_email || '',
        media_url: ad.media_url || '',
        link_url: ad.link_url || '',
        country: ad.country || '',
        position_id: ad.position_id || '',
        media_type: ad.media_type || 'image',
        size: ad.size || 'leaderboard',
      });
    } else {
      setEditingId(null);
      setForm(emptyForm);
    }
    setShowForm(true);
  };

  const saveAd = async () => {
    if (!form.title || !form.advertiser_name || !form.position_id) {
      toast.error('Plotëso: Titulli, Reklamues dhe Pozicioni');
      return;
    }
    setSaving(true);
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const payload = {
      title: form.title,
      advertiser_name: form.advertiser_name,
      advertiser_email: form.advertiser_email || 'admin@shitepronen.com',
      media_url: form.media_url || null,
      link_url: form.link_url || null,
      country: form.country || null,
      position_id: form.position_id,
      media_type: form.media_type,
      size: form.size,
    };

    if (editingId) {
      const { error } = await supabase.from('ads').update(payload).eq('id', editingId);
      setSaving(false);
      if (error) { toast.error('Gabim: ' + error.message); return; }
      toast.success('Reklama u përditësua!');
    } else {
      const { error } = await supabase.from('ads').insert({
        ...payload,
        status: 'active',
        start_date: now.toISOString(),
        end_date: end.toISOString(),
      });
      setSaving(false);
      if (error) { toast.error('Gabim: ' + error.message); return; }
      toast.success('Reklama u krijua dhe aktivizua!');
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchAds();
  };

  const approveAd = async (id: string) => {
    const now = new Date();
    const end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    await supabase.from('ads').update({ status: 'active', start_date: now.toISOString(), end_date: end.toISOString() }).eq('id', id);
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
    toast.success('Reklama u çaktivizua');
    fetchAds();
  };

  const deleteAd = async (id: string) => {
    if (!confirm('Fshi reklamën?')) return;
    await supabase.from('ads').delete().eq('id', id);
    setAds(prev => prev.filter(a => a.id !== id));
    toast.success('Reklama u fshi');
  };

  const statusStyle: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    active: 'bg-green-100 text-green-700',
    expired: 'bg-gray-100 text-gray-600',
    rejected: 'bg-red-100 text-red-700',
  };

  const inputCls = "w-full text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <AdminLayout title="Menaxhimi i Reklamave">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {['all', 'pending', 'active', 'expired', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
                filter === f ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
              }`}>
              {f === 'all' ? 'Të gjitha' : f === 'pending' ? 'Në pritje' : f === 'active' ? 'Aktive' : f === 'expired' ? 'Skaduar' : 'Refuzuar'}
            </button>
          ))}
        </div>
        <Button size="sm" className="btn-orange gap-1.5 flex-shrink-0" onClick={() => openForm()}>
          <Plus className="w-4 h-4" /> Reklama e Re
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-card border border-primary/30 rounded-xl p-5 mb-5 space-y-4">
          <h3 className="font-semibold text-foreground">
            {editingId ? '✏️ Ndrysho Reklamën' : '📢 Krijo Reklamë të Re'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Titulli *</label>
              <input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))}
                placeholder="Titulli i reklamës" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Reklamues *</label>
              <input value={form.advertiser_name} onChange={e => setForm(p => ({...p, advertiser_name: e.target.value}))}
                placeholder="Emri i reklamuesit" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email Reklamues</label>
              <input value={form.advertiser_email} onChange={e => setForm(p => ({...p, advertiser_email: e.target.value}))}
                placeholder="email@shembull.com" className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">URL e Linkut (klikimi)</label>
              <input value={form.link_url} onChange={e => setForm(p => ({...p, link_url: e.target.value}))}
                placeholder="https://..." className={inputCls} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Pozicioni *</label>
              <select value={form.position_id} onChange={e => setForm(p => ({...p, position_id: e.target.value}))}
                className={inputCls}>
                <option value="">Zgjedh pozicionin...</option>
                {positions.map(pos => (
                  <option key={pos.id} value={pos.id}>{pos.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">🎯 Shteti (Targetim)</label>
              <select value={form.country} onChange={e => setForm(p => ({...p, country: e.target.value}))}
                className={inputCls}>
                <option value="">🌍 Të gjitha (Global)</option>
                <option value="kosovo">🇽🇰 Kosovë</option>
                <option value="albania">🇦🇱 Shqipëri</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Lloji i Medias</label>
              <select value={form.media_type} onChange={e => setForm(p => ({...p, media_type: e.target.value as 'image' | 'video'}))}
                className={inputCls}>
                <option value="image">🖼️ Foto</option>
                <option value="video">🎥 Video</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">📐 Madhësia e Reklamës</label>
              <select value={form.size} onChange={e => setForm(p => ({...p, size: e.target.value}))}
                className={inputCls}>
                {Object.entries(AD_SIZES).map(([key, s]) => (
                  <option key={key} value={key}>{s.label}</option>
                ))}
              </select>
              {form.size && AD_SIZES[form.size] && (
                <p className="text-xs text-muted-foreground mt-1">
                  {AD_SIZES[form.size].w} × {AD_SIZES[form.size].h} px
                </p>
              )}
            </div>
            {/* Image upload */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Foto / Banner</label>
              <div className="flex gap-2">
                <input value={form.media_url} onChange={e => setForm(p => ({...p, media_url: e.target.value}))}
                  placeholder="URL e fotos ose ngarko..." className={`${inputCls} flex-1`} />
                <Button type="button" size="sm" variant="outline" className="flex-shrink-0 gap-1"
                  onClick={() => fileRef.current?.click()} disabled={uploading}>
                  <Upload className="w-3.5 h-3.5" />
                  {uploading ? '...' : 'Ngarko'}
                </Button>
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
                  onChange={e => e.target.files?.[0] && uploadImage(e.target.files[0])} />
              </div>
              {form.media_url && (
                <img src={form.media_url} alt="preview" className="mt-2 h-16 rounded-lg object-cover border border-border" />
              )}
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" className="btn-orange" onClick={saveAd} disabled={saving || uploading}>
              {saving ? 'Duke ruajtur...' : editingId ? '✓ Ruaj Ndryshimet' : '✓ Krijo & Aktivizo (30 ditë)'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>
              Anulo
            </Button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                {['Foto', 'Titulli / Reklamues', 'Pozicioni', 'Vendi', 'Statusi', 'Data', 'Veprime'].map(h => (
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
                    {ad.media_url ? (
                      <img src={ad.media_url} alt={ad.title} className="w-14 h-10 object-cover rounded-lg border border-border" />
                    ) : (
                      <div className="w-14 h-10 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground text-xs">—</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground max-w-36 truncate">{ad.title}</p>
                    <p className="text-xs text-muted-foreground">{ad.advertiser_name}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{ad.ad_positions?.display_name || '—'}</td>
                  <td className="px-4 py-3">
                    <select value={ad.country || ''} onChange={e => setAdCountry(ad.id, e.target.value || null)}
                      className="text-xs border border-border rounded-lg px-2 py-1 bg-background focus:outline-none">
                      <option value="">🌍 Global</option>
                      <option value="kosovo">🇽🇰 Kosovë</option>
                      <option value="albania">🇦🇱 Shqipëri</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusStyle[ad.status] || ''}`}>
                      {ad.status === 'active' ? 'Aktive' : ad.status === 'pending' ? 'Në pritje' : ad.status === 'expired' ? 'Skaduar' : 'Refuzuar'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(ad.created_at).toLocaleDateString('sq-AL')}
                    {ad.end_date && (
                      <p className="text-xs text-muted-foreground/70">deri {new Date(ad.end_date).toLocaleDateString('sq-AL')}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground"
                        onClick={() => openForm(ad)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      {ad.link_url && (
                        <Button size="sm" variant="ghost" className="h-7 px-2" asChild>
                          <a href={ad.link_url} target="_blank"><Eye className="w-3.5 h-3.5" /></a>
                        </Button>
                      )}
                      {ad.status === 'pending' && (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-green-600 border-green-200"
                          onClick={() => approveAd(ad.id)}>
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {(ad.status === 'pending' || ad.status === 'active') && (
                        <Button size="sm" variant="outline" className="h-7 px-2 text-destructive border-red-200"
                          onClick={() => rejectAd(ad.id)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={() => deleteAd(ad.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ads.length === 0 && !loading && (
          <div className="text-center py-10 text-muted-foreground">
            <p className="text-3xl mb-2">📢</p>
            <p className="font-medium">Nuk ka reklama ende</p>
            <p className="text-xs mt-1">Kliko "Reklama e Re" për të shtuar reklamën e parë</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
