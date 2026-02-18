import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Fjalëkalimi duhet të ketë të paktën 8 karaktere');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) {
      toast.error('Gabim gjatë regjistrimit: ' + (error as any).message);
    } else {
      setDone(true);
    }
    setLoading(false);
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✉️</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Konfirmoni Email-in</h1>
          <p className="text-muted-foreground mb-6">
            Ju kemi dërguar një email konfirmimi në <strong>{email}</strong>. Klikoni linkun për të aktivizuar llogarinë tuaj.
          </p>
          <Button asChild className="btn-orange">
            <Link to="/login">Kthehu te Hyrja</Link>
          </Button>
        </div>
      </div>
    );
  }

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
          <h2 className="text-3xl font-bold text-white mb-4">Filloni sot!</h2>
          <p className="text-white/60 text-lg mb-8">Regjistrohuni falas dhe postoni pronën tuaj te parë.</p>
          <div className="space-y-3">
            {[
              '✅ Regjistrim i shpejtë dhe falas',
              '🏠 Postoni pronën tuaj lehtë',
              '💳 Kredite me çmime të arsyeshme',
              '📊 Statistika të detajuara',
            ].map(item => (
              <div key={item} className="bg-white/10 rounded-lg px-4 py-2.5 text-white/80 text-sm text-left">
                {item}
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

          <h1 className="text-2xl font-bold text-foreground mb-1">Krijoni llogarinë</h1>
          <p className="text-muted-foreground mb-8">Falas dhe pa angazhim</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Emri i Plotë</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Emri Mbiemri"
                className="mt-1 h-11"
                required
              />
            </div>
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
            <div>
              <Label htmlFor="password">Fjalëkalimi</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 8 karaktere"
                  className="h-11 pr-10"
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Duke u regjistruar, ju pranoni{' '}
              <Link to="/terms" className="text-primary hover:underline">Kushtet e Shërbimit</Link>
              {' '}dhe{' '}
              <Link to="/privacy" className="text-primary hover:underline">Politikën e Privatësisë</Link>.
            </p>

            <Button type="submit" disabled={loading} className="w-full btn-orange h-11">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Regjistrohu Falas'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Keni llogari?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Hyrni
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
