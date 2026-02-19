import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Mail, ArrowLeft, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-magic-link', {
        body: { email },
      });
      if (error) {
        toast.error('Gabim: ' + error.message);
        return;
      }
      setStep('otp');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      toast.error('Gabim i papritur. Ju lutem provoni përsëri.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Allow only digits
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto-advance
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (digit && index === 5) {
      const fullCode = [...newOtp.slice(0, 5), digit].join('');
      if (fullCode.length === 6) {
        verifyOtp(fullCode);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      verifyOtp(pasted);
    }
  };

  const verifyOtp = async (code?: string) => {
    const finalCode = code || otp.join('');
    if (finalCode.length !== 6) {
      toast.error('Ju lutem plotësoni të gjitha 6 shifrat.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { email, code: finalCode },
      });
      if (error || !data?.success) {
        toast.error(data?.error || 'Kodi është i gabuar ose ka skaduar.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }
      // Navigate to action link to create real session
      if (data.action_link) {
        window.location.href = data.action_link;
      }
    } catch {
      toast.error('Gabim i papritur. Ju lutem provoni përsëri.');
    } finally {
      setLoading(false);
    }
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
                    <><Mail className="w-4 h-4 mr-2" />Dërgo Kodin</>
                  )}
                </Button>
              </form>

              <p className="text-center text-xs text-muted-foreground mt-6">
                Do të merrni një kod 6-shifror në email. Ai është i vlefshëm për 10 minuta.
              </p>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep('email')}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Kthehu
              </button>

              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Kontrolloni emailin</h1>
              <p className="text-muted-foreground mb-1">
                Kemi dërguar një kod 6-shifror te <strong>{email}</strong>
              </p>
              <p className="text-sm text-muted-foreground mb-8">Shikoni edhe dosjen <strong>Spam</strong> nëse nuk e gjeni.</p>

              {/* OTP Input */}
              <div className="flex gap-3 justify-center mb-6" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl bg-background text-foreground border-border focus:border-primary focus:outline-none transition-colors"
                    disabled={loading}
                  />
                ))}
              </div>

              <Button
                onClick={() => verifyOtp()}
                disabled={loading || otp.join('').length !== 6}
                className="w-full btn-orange h-11"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konfirmo & Hyr'}
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Nuk morët kodin?{' '}
                <button
                  onClick={() => handleSendOtp()}
                  disabled={loading}
                  className="text-primary hover:underline font-medium disabled:opacity-50"
                >
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
