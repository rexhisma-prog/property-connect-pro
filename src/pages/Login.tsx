import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Mail, ArrowLeft, ShieldCheck, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

type Step = 'email' | 'password' | 'otp' | 'set-password';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [tokenHash, setTokenHash] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 1: Check if user has password or needs OTP
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-user-auth', {
        body: { email },
      });
      if (error) {
        toast.error('Gabim: ' + error.message);
        return;
      }
      if (data?.has_password) {
        setStep('password');
      } else {
        await sendOtp();
      }
    } catch {
      toast.error('Gabim i papritur. Ju lutem provoni përsëri.');
    } finally {
      setLoading(false);
    }
  };

  // Send OTP
  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
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

  // Step 2a: Password login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error('Fjalëkalimi është i gabuar.');
        return;
      }
      navigate('/dashboard');
    } catch {
      toast.error('Gabim i papritur. Ju lutem provoni përsëri.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2b: OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    if (digit && index === 5) {
      const fullCode = [...newOtp.slice(0, 5), digit].join('');
      if (fullCode.length === 6) verifyOtp(fullCode);
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

  // Step 3: Verify OTP → get token_hash → create session → go to set-password
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

      // Establish session using token_hash
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: data.token_hash,
        type: 'magiclink',
      });

      if (verifyError) {
        toast.error('Gabim gjatë verifikimit. Ju lutem provoni përsëri.');
        return;
      }

      setTokenHash(data.token_hash);
      setStep('set-password');
    } catch {
      toast.error('Gabim i papritur. Ju lutem provoni përsëri.');
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Set new password
  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error('Fjalëkalimi duhet të ketë të paktën 6 karaktere.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Fjalëkalimet nuk përputhen.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error('Gabim gjatë vendosjes së fjalëkalimit: ' + error.message);
        return;
      }
      // Mark user as having a password
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('users').update({ has_password: true }).eq('id', user.id);
      }
      toast.success('Fjalëkalimi u vendos me sukses!');
      navigate('/dashboard');
    } catch {
      toast.error('Gabim i papritur. Ju lutem provoni përsëri.');
    } finally {
      setLoading(false);
    }
  };

  const leftPanel = (
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
  );

  const mobileLogo = (
    <div className="lg:hidden flex items-center gap-2 mb-8">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-lg">shite<span className="text-primary">pronen</span>.com</span>
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {leftPanel}

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md">
          {mobileLogo}

          {/* STEP: EMAIL */}
          {step === 'email' && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-1">Mirë se vini!</h1>
              <p className="text-muted-foreground mb-8">Hyni ose regjistrohuni me email</p>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                    <><Mail className="w-4 h-4 mr-2" />Vazhdo</>
                  )}
                </Button>
              </form>
            </>
          )}

          {/* STEP: PASSWORD (returning user) */}
          {step === 'password' && (
            <>
              <button onClick={() => setStep('email')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Kthehu
              </button>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Mirë se keni ardhur!</h1>
              <p className="text-muted-foreground mb-8">Hyni me fjalëkalimin tuaj për <strong>{email}</strong></p>
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <Label htmlFor="password">Fjalëkalimi</Label>
                  <div className="relative mt-1">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full btn-orange h-11">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hyr'}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-6">
                Keni harruar fjalëkalimin?{' '}
                <button onClick={() => sendOtp()} disabled={loading} className="text-primary hover:underline font-medium">
                  Merr kod verifikimi
                </button>
              </p>
            </>
          )}

          {/* STEP: OTP */}
          {step === 'otp' && (
            <>
              <button onClick={() => setStep('email')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Kthehu
              </button>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Kontrolloni emailin</h1>
              <p className="text-muted-foreground mb-1">Kemi dërguar një kod 6-shifror te <strong>{email}</strong></p>
              <p className="text-sm text-muted-foreground mb-8">Shikoni edhe dosjen <strong>Spam</strong> nëse nuk e gjeni.</p>

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
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konfirmo Kodin'}
              </Button>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Nuk morët kodin?{' '}
                <button onClick={() => sendOtp()} disabled={loading} className="text-primary hover:underline font-medium disabled:opacity-50">
                  Dërgoje përsëri
                </button>
              </p>
            </>
          )}

          {/* STEP: SET PASSWORD */}
          {step === 'set-password' && (
            <>
              <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-1">Vendosni Fjalëkalimin</h1>
              <p className="text-muted-foreground mb-8">Krijoni fjalëkalimin tuaj personal. Herën tjetër do të hyni me të.</p>

              <form onSubmit={handleSetPassword} className="space-y-4">
                <div>
                  <Label htmlFor="new-password">Fjalëkalimi i Ri</Label>
                  <div className="relative mt-1">
                    <Input
                      id="new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 karaktere"
                      className="h-11 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm-password">Konfirmo Fjalëkalimin</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Përsëriteni fjalëkalimin"
                    className="mt-1 h-11"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full btn-orange h-11">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Vendos Fjalëkalimin & Hyr'}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
