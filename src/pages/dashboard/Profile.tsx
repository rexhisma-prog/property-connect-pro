import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User, Mail, Phone, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });

  const set = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const validatePhone = (phone: string): string | null => {
    if (!phone) return null; // optional
    // Remove spaces for validation
    const clean = phone.replace(/\s/g, '');
    // Must be 04x + 6 digits (9 digits total) e.g. 044123456
    if (!/^04[4-9]\d{6}$/.test(clean)) {
      return 'Numri duhet të jetë në formatin 04x + 6 shifra (p.sh. 044 123 456)';
    }
    // Reject all-same digits: 044111111, 044222222...
    const digits = clean.slice(3);
    if (/^(\d)\1{5}$/.test(digits)) {
      return 'Numri nuk është valid (shifra të njëjta)';
    }
    // Reject repeating patterns like 121212, 313131, 123123
    if (/^(\d{2})\1{2}$/.test(digits) || /^(\d{3})\1$/.test(digits)) {
      return 'Numri nuk është valid (pattern i përsëritur)';
    }
    return null;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.phone) {
      const phoneError = validatePhone(form.phone);
      if (phoneError) {
        toast.error(phoneError);
        return;
      }
    }

    setLoading(true);

    const { error } = await supabase
      .from('users')
      .update({
        full_name: form.full_name || null,
        phone: form.phone || null,
      })
      .eq('id', user!.id);

    if (error) {
      toast.error('Gabim gjatë ruajtjes: ' + error.message);
    } else {
      await refreshProfile();
      toast.success('Profili u përditësua!');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Profili Im</h1>
          <p className="text-muted-foreground text-sm mt-1">Menaxhoni informacionin e llogarisë tuaj</p>
        </div>

        {/* Avatar */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground flex-shrink-0">
            {(profile?.full_name || profile?.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-foreground text-lg">{profile?.full_name || 'Pa emër'}</p>
            <p className="text-muted-foreground text-sm">{profile?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                profile?.role === 'admin' 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {profile?.role === 'admin' ? '👑 Admin' : '👤 Përdorues'}
              </span>
              <span className="text-xs text-muted-foreground">
                {profile?.credits_remaining} kredite
              </span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSave} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Ndrysho të Dhënat</h2>

          <div>
            <Label htmlFor="full_name">Emri i plotë</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="full_name"
                value={form.full_name}
                onChange={e => set('full_name', e.target.value)}
                placeholder="Emri juaj i plotë"
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                className="pl-9 bg-secondary text-muted-foreground"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Email-i nuk mund të ndryshohet</p>
          </div>

          <div>
            <Label htmlFor="phone">Numri i telefonit</Label>
            <div className="relative mt-1">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="044 123 456"
                className="pl-9"
                maxLength={12}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Formati: 044 123 456 (04x + 6 shifra)</p>
          </div>

          <Button type="submit" disabled={loading} className="w-full btn-orange">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ruaj Ndryshimet'}
          </Button>
        </form>

        {/* Account Info */}
        <div className="bg-card border border-border rounded-2xl p-6 mt-4 space-y-3">
          <h2 className="font-semibold text-foreground">Informacione Llogarisë</h2>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Anëtar që nga</span>
            <span className="font-medium">{profile?.created_at ? new Date(profile.created_at).toLocaleDateString('sq-AL') : '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Kredite të mbetura</span>
            <span className="font-semibold text-primary">{profile?.credits_remaining}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Statusi</span>
            <span className={`font-medium ${profile?.status === 'active' ? 'text-green-600' : 'text-destructive'}`}>
              {profile?.status === 'active' ? '✓ Aktiv' : profile?.status}
            </span>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
