import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Facebook, Instagram, Youtube, Save, Loader2 } from 'lucide-react';

const SOCIAL_KEYS = [
  { key: 'social_facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/faqjaote' },
  { key: 'social_instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/faqjaote' },
  { key: 'social_whatsapp', label: 'WhatsApp', icon: null, placeholder: 'https://wa.me/383xxxxxxxx' },
  { key: 'social_tiktok', label: 'TikTok', icon: null, placeholder: 'https://tiktok.com/@faqjaote' },
  { key: 'social_youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@faqjaote' },
];

export default function AdminSettings() {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('platform_settings').select('key, value');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(r => { map[r.key] = r.value; });
        setValues(map);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const { key } of SOCIAL_KEYS) {
        await supabase.from('platform_settings').upsert(
          { key, value: values[key] ?? '' },
          { onConflict: 'key' }
        );
      }
      toast({ title: 'Ruajtur!', description: 'Rrjetet sociale u ruajtën me sukses.' });
    } catch {
      toast({ title: 'Gabim', description: 'Ndodhi një gabim gjatë ruajtjes.', variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <AdminLayout title="Cilësimet">
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">🌐</span> Rrjetet Sociale
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {SOCIAL_KEYS.map(({ key, label, placeholder }) => (
                  <div key={key} className="space-y-1.5">
                    <Label htmlFor={key}>{label}</Label>
                    <Input
                      id={key}
                      placeholder={placeholder}
                      value={values[key] ?? ''}
                      onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                    />
                  </div>
                ))}
                <Button onClick={handleSave} disabled={saving} className="mt-2 gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Ruaj Ndryshimet
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
