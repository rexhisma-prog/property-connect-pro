import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, FlaskConical } from 'lucide-react';

const SOCIAL_KEYS = [
  { key: 'social_facebook', label: 'Facebook', placeholder: 'https://facebook.com/faqjaote' },
  { key: 'social_instagram', label: 'Instagram', placeholder: 'https://instagram.com/faqjaote' },
  { key: 'social_whatsapp', label: 'WhatsApp', placeholder: 'https://wa.me/383xxxxxxxx' },
  { key: 'social_tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@faqjaote' },
  { key: 'social_youtube', label: 'YouTube', placeholder: 'https://youtube.com/@faqjaote' },
];

export default function AdminSettings() {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [testingMode, setTestingMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('platform_settings').select('key, value');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(r => { map[r.key] = r.value; });
        setValues(map);
        setTestingMode(map['testing_mode'] === 'true');
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save social links
      for (const { key } of SOCIAL_KEYS) {
        await supabase.from('platform_settings').upsert(
          { key, value: values[key] ?? '' },
          { onConflict: 'key' }
        );
      }
      // Save testing mode
      await supabase.from('platform_settings').upsert(
        { key: 'testing_mode', value: testingMode ? 'true' : 'false' },
        { onConflict: 'key' }
      );
      toast({ title: 'Ruajtur!', description: 'Cilësimet u ruajtën me sukses.' });
    } catch {
      toast({ title: 'Gabim', description: 'Ndodhi një gabim gjatë ruajtjes.', variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <AdminLayout title="Cilësimet">
      <div className="max-w-2xl space-y-6">

        {/* Testing Mode */}
        <Card className={testingMode ? 'border-amber-400 bg-amber-50/50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-amber-500" />
              Modaliteti i Testimit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Postimet Falas</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Kur është aktiv, postimet nuk konsumojnë kredite. Çmimet ruhen dhe rikthehen automatikisht kur e çaktivizoni.
                    </p>
                  </div>
                  <Switch
                    checked={testingMode}
                    onCheckedChange={setTestingMode}
                  />
                </div>
                {testingMode && (
                  <div className="bg-amber-100 border border-amber-300 rounded-lg px-4 py-2.5 text-sm text-amber-800">
                    ⚠️ Faqja është në modalitetin e testimit — postimet janë falas
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Social Links */}
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
              SOCIAL_KEYS.map(({ key, label, placeholder }) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    placeholder={placeholder}
                    value={values[key] ?? ''}
                    onChange={e => setValues(v => ({ ...v, [key]: e.target.value }))}
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving || loading} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Ruaj të Gjitha Cilësimet
        </Button>
      </div>
    </AdminLayout>
  );
}
