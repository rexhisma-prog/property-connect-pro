import { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, GripVertical, Link, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface SocialPhoto {
  id: string;
  image_url: string;
  caption: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export default function AdminSocialPhotos() {
  const [photos, setPhotos] = useState<SocialPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newLink, setNewLink] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchPhotos(); }, []);

  const fetchPhotos = async () => {
    const { data } = await supabase
      .from('social_photos')
      .select('*')
      .order('sort_order', { ascending: true });
    setPhotos((data as SocialPhoto[]) || []);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `social/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast.error('Gabim gjatë ngarkimit të fotos');
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('property-images').getPublicUrl(fileName);
    const imageUrl = urlData.publicUrl;

    const maxOrder = photos.length > 0 ? Math.max(...photos.map(p => p.sort_order)) + 1 : 0;

    const { error } = await supabase.from('social_photos').insert({
      image_url: imageUrl,
      caption: newCaption || null,
      link_url: newLink || null,
      sort_order: maxOrder,
      is_active: true,
    });

    if (error) {
      toast.error('Gabim gjatë ruajtjes');
    } else {
      toast.success('Foto u shtua!');
      setNewCaption('');
      setNewLink('');
      fetchPhotos();
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Fshi foton?')) return;
    await supabase.from('social_photos').delete().eq('id', id);
    setPhotos(prev => prev.filter(p => p.id !== id));
    toast.success('Foto u fshi');
  };

  const toggleActive = async (photo: SocialPhoto) => {
    await supabase.from('social_photos').update({ is_active: !photo.is_active }).eq('id', photo.id);
    setPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, is_active: !p.is_active } : p));
  };

  const updateOrder = async (id: string, newOrder: number) => {
    await supabase.from('social_photos').update({ sort_order: newOrder }).eq('id', id);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...photos];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    const reordered = updated.map((p, i) => ({ ...p, sort_order: i }));
    setPhotos(reordered);
    reordered.forEach(p => updateOrder(p.id, p.sort_order));
  };

  const moveDown = (index: number) => {
    if (index === photos.length - 1) return;
    const updated = [...photos];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    const reordered = updated.map((p, i) => ({ ...p, sort_order: i }));
    setPhotos(reordered);
    reordered.forEach(p => updateOrder(p.id, p.sort_order));
  };

  return (
    <AdminLayout title="Galeria Sociale">
      {/* Upload Form */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-primary" /> Shto Foto të Re
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <input
            type="text"
            placeholder="Caption (opsionale)"
            value={newCaption}
            onChange={e => setNewCaption(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="url"
            placeholder="Link URL (opsionale, p.sh. Instagram)"
            value={newLink}
            onChange={e => setNewLink(e.target.value)}
            className="text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="btn-orange gap-2"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Duke ngarkuar...' : 'Ngarko Foto'}
        </Button>
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="aspect-square bg-secondary rounded-xl animate-pulse" />)}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-xl">
          <p className="text-4xl mb-3">📸</p>
          <p className="text-muted-foreground">Asnjë foto ende. Ngarko foton e parë!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={photo.id} className={`bg-card border rounded-xl overflow-hidden ${photo.is_active ? 'border-border' : 'border-border opacity-50'}`}>
              <div className="relative aspect-square">
                <img src={photo.image_url} alt={photo.caption || ''} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    className="w-6 h-6 bg-black/60 text-white rounded flex items-center justify-center text-xs disabled:opacity-30"
                  >↑</button>
                  <button
                    onClick={() => moveDown(index)}
                    disabled={index === photos.length - 1}
                    className="w-6 h-6 bg-black/60 text-white rounded flex items-center justify-center text-xs disabled:opacity-30"
                  >↓</button>
                </div>
              </div>
              <div className="p-3 space-y-2">
                {photo.caption && <p className="text-xs text-foreground font-medium truncate">{photo.caption}</p>}
                {photo.link_url && (
                  <a href={photo.link_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-primary hover:underline truncate">
                    <Link className="w-3 h-3 flex-shrink-0" /> {photo.link_url}
                  </a>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => toggleActive(photo)}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors ${
                      photo.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-secondary text-muted-foreground hover:bg-border'
                    }`}
                  >
                    {photo.is_active ? 'Aktive' : 'Çaktivizuar'}
                  </button>
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="ml-auto text-destructive hover:text-destructive/80 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
