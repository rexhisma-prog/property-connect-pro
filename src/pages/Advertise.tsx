import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdPosition } from '@/lib/supabase-types';
import { Upload, CheckCircle, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Advertise() {
  const [positions, setPositions] = useState<AdPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    advertiser_name: '',
    advertiser_email: '',
    title: '',
    link_url: '',
    position_id: '',
  });

  useEffect(() => {
    supabase.from('ad_positions').select('*').eq('is_active', true)
      .then(({ data }) => setPositions((data as AdPosition[]) || []));
  }, []);

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Skedari është shumë i madh (max 50MB)');
      return;
    }
    setUploading(true);
    const isVideo = file.type.startsWith('video/');
    setMediaType(isVideo ? 'video' : 'image');
    const ext = file.name.split('.').pop();
    const path = `ads/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('ad-media').upload(path, file);
    if (error) {
      toast.error('Gabim gjatë ngarkimit');
    } else {
      const { data } = supabase.storage.from('ad-media').getPublicUrl(path);
      setMediaUrl(data.publicUrl);
      toast.success('Media u ngarkua!');
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.advertiser_name || !form.advertiser_email || !form.title || !form.position_id) {
      toast.error('Plotësoni të gjitha fushat e detyrueshme');
      return;
    }
    setLoading(true);
    const { error } = await supabase.from('ads').insert({
      advertiser_name: form.advertiser_name,
      advertiser_email: form.advertiser_email,
      title: form.title,
      link_url: form.link_url || null,
      position_id: form.position_id,
      media_url: mediaUrl || null,
      media_type: mediaType,
      status: 'pending',
    });
    if (error) {
      toast.error('Gabim: ' + error.message);
    } else {
      setDone(true);
    }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Kërkesa u Dërgua!</h1>
            <p className="text-muted-foreground mb-6">
              Ekipi ynë do ta shqyrtojë reklamën tuaj brenda 24 orësh. Do ju kontaktojmë me instruksione pagese.
            </p>
            <Button className="btn-orange" asChild><a href="/">Kthehu në Faqe Kryesore</a></Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <div className="bg-foreground text-white py-14 text-center px-4">
          <Building2 className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="text-4xl font-bold mb-3">Reklamo tek ne</h1>
          <p className="text-white/60 max-w-xl mx-auto">
            Arritni mijëra blerës dhe shitës pronash çdo ditë. Ideal për banka, kompani ndërtimi dhe sigurimesh.
          </p>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {[
              { icon: '👁️', stat: '10,000+', label: 'Shikimet ditore' },
              { icon: '🏙️', stat: '30+', label: 'Qytete aktive' },
              { icon: '💰', stat: '€29+', label: 'Çmimi mujor' },
            ].map(s => (
              <div key={s.label} className="text-center p-4 bg-card border border-border rounded-xl">
                <p className="text-3xl mb-1">{s.icon}</p>
                <p className="text-2xl font-bold text-primary">{s.stat}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-semibold mb-6">Plotësoni Formularin</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Emri Kompanisë <span className="text-destructive">*</span></Label>
                  <Input id="name" value={form.advertiser_name} onChange={e => set('advertiser_name', e.target.value)}
                    placeholder="Kompania XYZ" className="mt-1" required />
                </div>
                <div>
                  <Label htmlFor="email">Email Kontakti <span className="text-destructive">*</span></Label>
                  <Input id="email" type="email" value={form.advertiser_email} onChange={e => set('advertiser_email', e.target.value)}
                    placeholder="info@kompania.com" className="mt-1" required />
                </div>
              </div>

              <div>
                <Label htmlFor="title">Titulli i Reklamës <span className="text-destructive">*</span></Label>
                <Input id="title" value={form.title} onChange={e => set('title', e.target.value)}
                  placeholder="p.sh. Banka XYZ - Kredi Hipotekore" className="mt-1" required />
              </div>

              <div>
                <Label>Pozicioni <span className="text-destructive">*</span></Label>
                <select value={form.position_id} onChange={e => set('position_id', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" required>
                  <option value="">Zgjidhni pozicionin</option>
                  {positions.map(pos => (
                    <option key={pos.id} value={pos.id}>
                      {pos.display_name} — €{pos.price_month_eur}/muaj
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="link">Link URL (opsionale)</Label>
                <Input id="link" type="url" value={form.link_url} onChange={e => set('link_url', e.target.value)}
                  placeholder="https://www.kompania.com" className="mt-1" />
              </div>

              {/* Media Upload */}
              <div>
                <Label>Media (Foto ose Video)</Label>
                <div
                  className="mt-1 border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploading ? (
                    <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                  ) : mediaUrl ? (
                    <div className="space-y-2">
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                      <p className="text-sm text-green-600 font-medium">Media u ngarkua!</p>
                      <p className="text-xs text-muted-foreground">Klikoni për të ndryshuar</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Ngarkoni foto ose video reklamë</p>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG, MP4, WebM · Max 50MB</p>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMediaUpload} />
                </div>
              </div>

              <Button type="submit" disabled={loading} className="w-full btn-orange h-11">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dërgo Kërkesën'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Pas dorëzimit, ekipi ynë do të kontaktojë brenda 24 orësh me instruksione pagese.
              </p>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
