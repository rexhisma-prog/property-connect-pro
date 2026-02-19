import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error('Gabim: ' + error.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">shite<span className="text-primary">pronen</span>.com</span>
        </Link>

        {sent ? (
          <div className="text-center space-y-4 bg-card border border-border rounded-2xl p-8">
            <CheckCircle className="w-14 h-14 text-green-500 mx-auto" />
            <h1 className="text-xl font-bold text-foreground">Emaili u dërgua!</h1>
            <p className="text-muted-foreground text-sm">
              Kemi dërguar një link resetimi te <strong>{email}</strong>. Kontrolloni inbox-in (dhe spam).
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full mt-2">Kthehu te hyrja</Button>
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8">
            <h1 className="text-2xl font-bold text-foreground mb-1">Harruat fjalëkalimin?</h1>
            <p className="text-muted-foreground text-sm mb-6">
              Shkruani emailin tuaj dhe do t'ju dërgojmë një link për të vendosur fjalëkalim të ri.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@shembull.com"
                  className="mt-1 h-11"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full btn-orange h-11">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Dërgo linkun e resetimit'}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              <Link to="/login" className="text-primary hover:underline">← Kthehu te hyrja</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
