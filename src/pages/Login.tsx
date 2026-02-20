import { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import logoImg from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import { setOtpRegistering } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Mail, ArrowLeft, ShieldCheck, Lock, Eye, EyeOff, Phone } from 'lucide-react';
import { toast } from 'sonner';

type RegisterStep = 'email' | 'otp' | 'set-password';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'login' | 'register'>(
    searchParams.get('tab') === 'register' ? 'register' : 'login'
  );

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerStep, setRegisterStep] = useState<RegisterStep>('email');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ─── LOGIN ───────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });
      if (error) {
        toast.error('Email ose fjalëkalim i gabuar.');
        return;
      }
      navigate('/dashboard');
    } catch {
      toast.error('Gabim i papritur. Ju lutem provoni përsëri.');
    } finally {
      setLoginLoading(false);
    }
  };

  // ─── REGISTER: SEND OTP ──────────────────────────────────
  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setRegisterLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-magic-link', {
        body: { email: registerEmail },
      });
      if (error) {
        toast.error('Gabim: ' + error.message);
        return;
      }
      setRegisterStep('otp');
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch {
      toast.error('Gabim i papritur. Ju lutem provoni përsëri.');
    } finally {
      setRegisterLoading(false);
    }
  };

  // ─── REGISTER: OTP HANDLERS ──────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
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

  // ─── REGISTER: VERIFY OTP ────────────────────────────────
  const verifyOtp = async (code?: string) => {
    const finalCode = code || otp.join('');
    if (finalCode.length !== 6) {
      toast.error('Ju lutem plotësoni të gjitha 6 shifrat.');
      return;
    }
    setRegisterLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { email: registerEmail, code: finalCode },
      });
      if (error || !data?.success) {
        toast.error(data?.error || 'Kodi është i gabuar ose ka skaduar.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }
      // Set flag to prevent auto-redirect during registration
      setOtpRegistering(true);
      // Establish session directly with tokens from edge function
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionError) {
        setOtpRegistering(false);
        toast.error('Gabim gjatë verifikimit. Ju lutem provoni përsëri.');
        return;
      }
      setRegisterStep('set-password');
    } catch {
      toast.error('Gabim i papritur. Ju lutem provoni përsëri.');
    } finally {
      setRegisterLoading(false);
    }
  };

  // ─── REGISTER: SET PASSWORD ──────────────────────────────
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
    // Validate phone number - international format
    const phoneClean = phoneNumber.replace(/\s/g, '');
    if (!/^\+[1-9][0-9]{6,14}$/.test(phoneClean)) {
      toast.error('Numri duhet të fillojë me + dhe kodin e vendit (p.sh. +383 44 123 456).');
      return;
    }
    setRegisterLoading(true);
    try {
      // Check if phone number is already taken
      const phoneClean2 = phoneClean;
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phoneClean2)
        .maybeSingle();
      
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (existingUser && currentUser && existingUser.id !== currentUser.id) {
        toast.error('Ky numër telefoni është i regjistruar tashmë në sistem. Ju lutem përdorni një numër tjetër.');
        setRegisterLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error('Gabim: ' + error.message);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: user.id,
            email: user.email!,
            has_password: true,
            phone: phoneClean,
          }, { onConflict: 'id' });
        if (upsertError) {
          if (upsertError.code === '23505') {
            toast.error('Ky numër telefoni është i regjistruar tashmë në sistem. Ju lutem përdorni një numër tjetër.');
            return;
          }
          toast.error('Gabim gjatë ruajtjes së numrit të telefonit.');
          return;
        }
      }
      setOtpRegistering(false);
      toast.success('Llogaria u krijua me sukses!');
      navigate('/dashboard');
    } catch {
      toast.error('Gabim i papritur. Ju lutem provoni përsëri.');
    } finally {
      setRegisterLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-foreground" />
        <div className="relative z-10 text-center px-12">
          <Link to="/" className="flex items-center justify-center mb-8">
            <div className="bg-white rounded-2xl px-6 py-3 inline-flex">
              <img src={logoImg} alt="ShitePronen.com" className="h-12 w-auto object-contain" />
            </div>
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

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center mb-8">
            <Link to="/">
              <img src={logoImg} alt="ShitePronen.com" className="h-10 w-auto" />
            </Link>
          </div>


          {/* ── LOGIN TAB ── */}
          {tab === 'login' && (
            <>
              <h1 className="text-2xl font-bold text-foreground mb-1">Mirë se keni ardhur!</h1>
              <p className="text-muted-foreground mb-8">Hyni me email dhe fjalëkalimin tuaj</p>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="email@shembull.com"
                    className="mt-1 h-11"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="login-password">Fjalëkalimi</Label>
                  <div className="relative mt-1">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="h-11 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loginLoading} className="w-full btn-orange h-11">
                  {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <><Lock className="w-4 h-4 mr-2" />Hyr</>
                  )}
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground mt-6">
                Nuk keni llogari?{' '}
                <button onClick={() => setTab('register')} className="text-primary hover:underline font-medium">
                  Regjistrohuni
                </button>
              </p>
            </>
          )}

          {/* ── REGISTER TAB ── */}
          {tab === 'register' && (
            <>
              {/* Step: Email */}
              {registerStep === 'email' && (
                <>
                  <h1 className="text-2xl font-bold text-foreground mb-1">Krijoni llogari</h1>
                  <p className="text-muted-foreground mb-8">Futni emailin tuaj dhe do t'ju dërgojmë një kod verifikimi</p>
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        value={registerEmail}
                        onChange={e => setRegisterEmail(e.target.value)}
                        placeholder="email@shembull.com"
                        className="mt-1 h-11"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={registerLoading} className="w-full btn-orange h-11">
                      {registerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <><Mail className="w-4 h-4 mr-2" />Dërgo Kodin</>
                      )}
                    </Button>
                  </form>
                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Keni llogari?{' '}
                    <button onClick={() => setTab('login')} className="text-primary hover:underline font-medium">
                      Hyni këtu
                    </button>
                  </p>
                </>
              )}

              {/* Step: OTP */}
              {registerStep === 'otp' && (
                <>
                  <button onClick={() => setRegisterStep('email')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Kthehu
                  </button>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">Kontrolloni emailin</h1>
                  <p className="text-muted-foreground mb-1">Kemi dërguar një kod 6-shifror te <strong>{registerEmail}</strong></p>
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
                        disabled={registerLoading}
                      />
                    ))}
                  </div>

                  <Button
                    onClick={() => verifyOtp()}
                    disabled={registerLoading || otp.join('').length !== 6}
                    className="w-full btn-orange h-11"
                  >
                    {registerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konfirmo Kodin'}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Nuk morët kodin?{' '}
                    <button onClick={() => handleSendOtp()} disabled={registerLoading} className="text-primary hover:underline font-medium disabled:opacity-50">
                      Dërgoje përsëri
                    </button>
                  </p>
                </>
              )}

              {/* Step: Set Password */}
              {registerStep === 'set-password' && (
                <>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <Lock className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">Finalizoni Llogarinë</h1>
                  <p className="text-muted-foreground mb-8">Vendosni numrin e telefonit dhe fjalëkalimin tuaj personal.</p>

                  <form onSubmit={handleSetPassword} className="space-y-4">
                    <div>
                      <Label htmlFor="phone-number">Numri i Telefonit</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone-number"
                          type="tel"
                          value={phoneNumber}
                          onChange={e => setPhoneNumber(e.target.value.replace(/[^0-9+\s]/g, ''))}
                          placeholder="+383 44 123 456"
                          className="h-11 pl-9"
                          required
                          maxLength={20}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Format ndërkombëtar: +383 (Kosovë), +381 (Serbi), +41 (Zvicër)...</p>
                    </div>
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
                    <Button type="submit" disabled={registerLoading} className="w-full btn-orange h-11">
                      {registerLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Krijo Llogarinë & Hyr'}
                    </Button>
                  </form>
                </>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
