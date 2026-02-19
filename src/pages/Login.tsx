import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);


  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: 'https://www.shitepronen.com',
      },
    });
    setLoading(false);
    if (error) {
      toast.error('Gabim: ' + error.message);
      return;
    }
    setStep('otp');
  };





  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-foreground" />
        <div className="relative z-10 text-center px-12">
          <Link to="/" className="flex items-center justify-center gap-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              shite<span className="text-primary">pronen</span>.com
            </span>
          </Link>
          <h2 className="text-3xl font-bold text-white mb-4">Platforma #1 e Pronave</h2>
          <p className="text-white/60 text-lg">Blej, shit dhe qiraje prona me lehtësi dhe besim të plotë.</p>
          <div className="grid grid-cols-3 gap-4 mt-10">
            {[
              { icon: '🏠', label: '10,000+ Prona' },
              { icon: '🏙️', label: '30+ Qytete' },
              { icon: '✅', label: '5,000+ Shitje' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-xs text-white/70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">shite<span className="text-primary">pronen</span>.com</span>
            </Link>
          </div>

          {step === 'email' ? (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-1">Mirë se vini!</h1>
              <p className="text-muted-foreground mb-8">Hyni ose regjistrohuni me email</p>

              <form onSubmit={handleSendOtp} className="space-y-4">
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
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <><Mail className="w-4 h-4 mr-2" />Dërgo Linkun e Hyrjes</>
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground mt-6">
                Do të merrni një link hyrjeje në email. Klikoni atë për të hyrë.
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep('email'); }}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Kthehu
              </button>

              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Kontrolloni emailin</h1>
              <p className="text-muted-foreground mb-2">
                Kemi dërguar një link hyrjeje te <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-6">Klikoni butonin <strong>"Log In"</strong> në email për të hyrë në llogari.</p>
              <p className="text-sm text-muted-foreground">Shikoni edhe dosjen <strong>Spam</strong> nëse nuk e gjeni.</p>

              <p className="text-center text-sm text-muted-foreground mt-8">
                Nuk morët emailin?{' '}
                <button onClick={handleSendOtp} className="text-primary hover:underline font-medium">
                  Dërgoje përsëri
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
