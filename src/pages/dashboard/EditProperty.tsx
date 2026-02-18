import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CITIES } from '@/lib/supabase-types';
import { Upload, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EditProperty() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [images, setImages] = useState<string[]>([]);

  const [form, setForm] = useState({
    title: '',
    description: '',
    price: '',
    city: '',
    address: '',
    property_type: 'apartment',
    listing_type: 'shitje',
    bedrooms: '',
    bathrooms: '',
    area_m2: '',
    has_pranim_teknik: false,
  });

  useEffect(() => {
    if (!id) return;
    fetchProperty();
  }, [id]);

  const fetchProperty = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('id', id!)
      .eq('user_id', user!.id)
      .single();

    if (error || !data) {
      toast.error('Prona nuk u gjet ose nuk keni akses');
      navigate('/dashboard/properties');
      return;
    }

    setForm({
      title: data.title,
      description: data.description || '',
      price: String(data.price),
      city: data.city,
      address: data.address || '',
      property_type: data.property_type,
      listing_type: data.listing_type,
      bedrooms: data.bedrooms ? String(data.bedrooms) : '',
      bathrooms: data.bathrooms ? String(data.bathrooms) : '',
      area_m2: data.area_m2 ? String(data.area_m2) : '',
      has_pranim_teknik: (data as any).has_pranim_teknik ?? false,
    });
    setImages(data.images || []);
    setFetching(false);
  };

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > 10) {
      toast.error('Maksimumi 10 foto');
      return;
    }

    setUploading(true);
    const uploaded: string[] = [];

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} është shumë i madh (max 10MB)`);
        continue;
      }
      const ext = file.name.split('.').pop();
      const path = `${user!.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('property-images').upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from('property-images').getPublicUrl(path);
        uploaded.push(data.publicUrl);
      }
    }

    setImages(prev => [...prev, ...uploaded]);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (url: string) => setImages(prev => prev.filter(u => u !== url));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.price || !form.city) {
      toast.error('Plotësoni fushat e detyrueshme');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('properties').update({
      title: form.title,
      description: form.description || null,
      price: parseFloat(form.price),
      city: form.city,
      address: form.address || null,
      property_type: form.property_type as any,
      listing_type: form.listing_type as any,
      bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
      bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
      area_m2: form.area_m2 ? parseFloat(form.area_m2) : null,
      images,
      has_pranim_teknik: form.has_pranim_teknik,
    } as any).eq('id', id!).eq('user_id', user!.id);

    if (error) {
      toast.error('Gabim: ' + error.message);
      setLoading(false);
      return;
    }

    toast.success('Prona u përditësua!');
    navigate('/dashboard/properties');
    setLoading(false);
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Edito Pronën</h1>
          <p className="text-muted-foreground text-sm mt-1">Ndryshimet ruhen pa konsumuar kredite</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Informata Bazë</h2>
            <div>
              <Label htmlFor="title">Titulli <span className="text-destructive">*</span></Label>
              <Input id="title" value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="p.sh. Apartament 2+1 me pamje, Prishtinë" className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="description">Përshkrimi</Label>
              <Textarea id="description" value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Përshkruani pronën në detaje..." className="mt-1 min-h-28" rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Lloji i Pronës <span className="text-destructive">*</span></Label>
                <select value={form.property_type} onChange={e => set('property_type', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="apartment">Apartament</option>
                  <option value="house">Shtëpi</option>
                  <option value="land">Tokë</option>
                  <option value="commercial">Lokal/Komercial</option>
                </select>
              </div>
              <div>
                <Label>Lloji i Listimit <span className="text-destructive">*</span></Label>
                <select value={form.listing_type} onChange={e => set('listing_type', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="shitje">Shitje</option>
                  <option value="qira">Me Qira</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Vendndodhja & Çmimi</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Qyteti <span className="text-destructive">*</span></Label>
                <select value={form.city} onChange={e => set('city', e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary" required>
                  <option value="">Zgjidhni qytetin</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="address">Adresa</Label>
                <Input id="address" value={form.address} onChange={e => set('address', e.target.value)}
                  placeholder="Rruga, numri..." className="mt-1" />
              </div>
            </div>
            <div>
              <Label htmlFor="price">Çmimi (EUR) <span className="text-destructive">*</span></Label>
              <Input id="price" type="number" value={form.price} onChange={e => set('price', e.target.value)}
                placeholder="0" className="mt-1" required min="0" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Detajet</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bedrooms">Dhoma Gjumi</Label>
                <Input id="bedrooms" type="number" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)}
                  placeholder="0" className="mt-1" min="0" />
              </div>
              <div>
                <Label htmlFor="bathrooms">Banjo</Label>
                <Input id="bathrooms" type="number" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)}
                  placeholder="0" className="mt-1" min="0" />
              </div>
              <div>
                <Label htmlFor="area_m2">Sipërfaqja (m²)</Label>
                <Input id="area_m2" type="number" value={form.area_m2} onChange={e => set('area_m2', e.target.value)}
                  placeholder="0" className="mt-1" min="0" />
              </div>
            </div>
            {/* Pranim Teknik */}
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-border hover:bg-secondary transition-colors">
              <input
                type="checkbox"
                checked={form.has_pranim_teknik}
                onChange={e => setForm(prev => ({ ...prev, has_pranim_teknik: e.target.checked }))}
                className="w-4 h-4 accent-primary rounded"
              />
              <div>
                <p className="font-medium text-sm text-foreground">Ka Pranim Teknik</p>
                <p className="text-xs text-muted-foreground">Prona posedon dokumentin e pranimit teknik</p>
              </div>
            </label>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h2 className="font-semibold text-foreground">Fotot ({images.length}/10)</h2>
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-accent/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
              ) : (
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              )}
              <p className="text-sm text-muted-foreground">
                {uploading ? 'Duke ngarkuar...' : 'Kliko ose zvarrit fotot këtu'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP · Max 10MB secila · Max 10 foto</p>
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {images.map((url, i) => (
                  <div key={url} className="relative aspect-square rounded-lg overflow-hidden group">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-primary/80 text-white text-xs text-center py-0.5">
                        Kryesorja
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeImage(url)}
                      className="absolute top-1 right-1 w-5 h-5 bg-destructive text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => navigate('/dashboard/properties')}>
              Anulo
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 btn-orange">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ruaj Ndryshimet'}
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
