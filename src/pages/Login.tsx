import { useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import logoImg from '@/assets/logo.png';
import { supabase } from '@/integrations/supabase/client';
import { setOtpRegistering } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, Loader2, Mail, ArrowLeft, ShieldCheck, Lock, Eye, EyeOff, Phone, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

type RegisterStep = 'email' | 'otp' | 'set-password';
type ForgotStep = 'email-phone' | 'otp' | 'new-password';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(
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

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email-phone');
  const [forgotOtp, setForgotOtp] = useState(['', '', '', '', '', '']);
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const forgotOtpRefs = useRef<(HTMLInputElement | null)[]>([]);

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
      const res = await supabase.functions.invoke('send-magic-link', {
        body: { email: registerEmail, purpose: 'register' },
      });
      
      // Check for email_exists error
      if (res.error || res.data?.error) {
        const errorData = res.data;
        if (errorData?.error === 'email_exists') {
          toast.error('Ky email është i regjistruar tashmë. Përdorni hyrjen ose ndryshoni fjalëkalimin.', {
            action: {
              label: 'Ndrysho fjalëkalimin',
              onClick: () => {
                setForgotEmail(registerEmail);
                setTab('forgot');
              },
            },
          });
          return;
        }
        toast.error(errorData?.message || res.error?.message || 'Gabim gjatë dërgimit të kodit.');
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
      setOtpRegistering(true);
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
    const phoneClean = phoneNumber.replace(/\s/g, '');
    if (!/^\+[1-9][0-9]{6,14}$/.test(phoneClean)) {
      toast.error('Numri duhet të fillojë me + dhe kodin e vendit (p.sh. +383 44 123 456).');
      return;
    }
    setRegisterLoading(true);
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('phone', phoneClean)
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

  // ─── FORGOT: SEND OTP ────────────────────────────────────
  const handleForgotSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneClean = forgotPhone.replace(/\s/g, '');
    if (!/^\+[1-9][0-9]{6,14}$/.test(phoneClean)) {
      toast.error('Numri duhet të fillojë me + dhe kodin e vendit (p.sh. +383 44 123 456).');
      return;
    }
    setForgotLoading(true);
    try {
      const res = await supabase.functions.invoke('send-magic-link', {
        body: { email: forgotEmail, purpose: 'reset', phone: phoneClean },
      });
      
      // Handle non-2xx: parse error body from FunctionsHttpError
      let errorData = res.data;
      if (res.error) {
        try {
          const ctx = (res.error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            errorData = await ctx.json();
          }
        } catch { /* ignore parse errors */ }
      }
      if (res.error || errorData?.error) {
        if (errorData?.error === 'phone_mismatch' || errorData?.error === 'user_not_found') {
          toast.error('Emaili ose numri i telefonit është i gabuar. Ju lutem kontrolloni të dhënat dhe provoni përsëri.');
        } else {
          toast.error(errorData?.message || res.error?.message || 'Gabim gjatë dërgimit të kodit.');
        }
        return;
      }
      setForgotStep('otp');
      setForgotOtp(['', '', '', '', '', '']);
      setTimeout(() => forgotOtpRefs.current[0]?.focus(), 100);
    } catch {
      toast.error('Gabim i papritur. Ju lutem provoni përsëri.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ─── FORGOT: OTP HANDLERS ────────────────────────────────
  const handleForgotOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...forgotOtp];
    newOtp[index] = digit;
    setForgotOtp(newOtp);
    if (digit && index < 5) forgotOtpRefs.current[index + 1]?.focus();
    if (digit && index === 5) {
      const fullCode = [...newOtp.slice(0, 5), digit].join('');
      if (fullCode.length === 6) verifyForgotOtp(fullCode);
    }
  };

  const handleForgotOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !forgotOtp[index] && index > 0) {
      forgotOtpRefs.current[index - 1]?.focus();
    }
  };

  const handleForgotOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setForgotOtp(pasted.split(''));
      verifyForgotOtp(pasted);
    }
  };

  // ─── FORGOT: VERIFY OTP ──────────────────────────────────
  const verifyForgotOtp = async (code?: string) => {
    const finalCode = code || forgotOtp.join('');
    if (finalCode.length !== 6) {
      toast.error('Ju lutem plotësoni të gjitha 6 shifrat.');
      return;
    }
    setForgotLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: { email: forgotEmail, code: finalCode },
      });
      if (error || !data?.success) {
        toast.error(data?.error || 'Kodi është i gabuar ose ka skaduar.');
        setForgotOtp(['', '', '', '', '', '']);
        forgotOtpRefs.current[0]?.focus();
        return;
      }
      // Set session for password update
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (sessionError) {
        toast.error('Gabim gjatë verifikimit. Ju lutem provoni përsëri.');
        return;
      }
      setForgotStep('new-password');
    } catch {
      toast.error('Gabim i papritur. Ju lutem provoni përsëri.');
    } finally {
      setForgotLoading(false);
    }
  };

  // ─── FORGOT: SET NEW PASSWORD ─────────────────────────────
  const handleForgotSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (forgotNewPassword.length < 6) {
      toast.error('Fjalëkalimi duhet të ketë të paktën 6 karaktere.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      toast.error('Fjalëkalimet nuk përputhen.');
      return;
    }
    setForgotLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: forgotNewPassword });
      if (error) {
        toast.error('Gabim: ' + error.message);
        return;
      }
      toast.success('Fjalëkalimi u ndryshua me sukses! Tani mund të hyni.');
      // Reset forgot state and go to login
      setForgotStep('email-phone');
      setForgotEmail('');
      setForgotPhone('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      await supabase.auth.signOut();
      setTab('login');
    } catch {
      toast.error('Gabim i papritur. Ju lutem provoni përsëri.');
    } finally {
      setForgotLoading(false);
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
                  <div className="text-right mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(loginEmail);
                        setTab('forgot');
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Keni harruar fjalëkalimin?
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

          {/* ── FORGOT PASSWORD TAB ── */}
          {tab === 'forgot' && (
            <>
              {/* Step: Email + Phone */}
              {forgotStep === 'email-phone' && (
                <>
                  <button onClick={() => { setTab('login'); setForgotStep('email-phone'); }} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Kthehu te hyrja
                  </button>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <KeyRound className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">Ndryshoni fjalëkalimin</h1>
                  <p className="text-muted-foreground mb-8">Futni emailin dhe numrin e telefonit të llogarisë suaj për verifikim.</p>
                  <form onSubmit={handleForgotSendOtp} className="space-y-4">
                    <div>
                      <Label htmlFor="forgot-email">Email</Label>
                      <Input
                        id="forgot-email"
                        type="email"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="email@shembull.com"
                        className="mt-1 h-11"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="forgot-phone">Numri i Telefonit</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="forgot-phone"
                          type="tel"
                          value={forgotPhone}
                          onChange={e => setForgotPhone(e.target.value.replace(/[^0-9+\s]/g, ''))}
                          placeholder="+383 44 123 456"
                          className="h-11 pl-9"
                          required
                          maxLength={20}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Duhet të jetë numri i njëjtë që keni përdorur gjatë regjistrimit.</p>
                    </div>
                    <Button type="submit" disabled={forgotLoading} className="w-full btn-orange h-11">
                      {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <><Mail className="w-4 h-4 mr-2" />Dërgo Kodin e Verifikimit</>
                      )}
                    </Button>
                  </form>
                </>
              )}

              {/* Step: OTP */}
              {forgotStep === 'otp' && (
                <>
                  <button onClick={() => setForgotStep('email-phone')} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Kthehu
                  </button>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <ShieldCheck className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">Kontrolloni emailin</h1>
                  <p className="text-muted-foreground mb-1">Kemi dërguar një kod 6-shifror te <strong>{forgotEmail}</strong></p>
                  <p className="text-sm text-muted-foreground mb-8">Shikoni edhe dosjen <strong>Spam</strong> nëse nuk e gjeni.</p>

                  <div className="flex gap-3 justify-center mb-6" onPaste={handleForgotOtpPaste}>
                    {forgotOtp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => { forgotOtpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleForgotOtpChange(i, e.target.value)}
                        onKeyDown={e => handleForgotOtpKeyDown(i, e)}
                        className="w-12 h-14 text-center text-2xl font-bold border-2 rounded-xl bg-background text-foreground border-border focus:border-primary focus:outline-none transition-colors"
                        disabled={forgotLoading}
                      />
                    ))}
                  </div>

                  <Button
                    onClick={() => verifyForgotOtp()}
                    disabled={forgotLoading || forgotOtp.join('').length !== 6}
                    className="w-full btn-orange h-11"
                  >
                    {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Konfirmo Kodin'}
                  </Button>

                  <p className="text-center text-sm text-muted-foreground mt-6">
                    Nuk morët kodin?{' '}
                    <button onClick={() => handleForgotSendOtp({ preventDefault: () => {} } as React.FormEvent)} disabled={forgotLoading} className="text-primary hover:underline font-medium disabled:opacity-50">
                      Dërgoje përsëri
                    </button>
                  </p>
                </>
              )}

              {/* Step: New Password */}
              {forgotStep === 'new-password' && (
                <>
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <Lock className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground mb-1">Fjalëkalimi i Ri</h1>
                  <p className="text-muted-foreground mb-8">Vendosni fjalëkalimin tuaj të ri.</p>

                  <form onSubmit={handleForgotSetPassword} className="space-y-4">
                    <div>
                      <Label htmlFor="forgot-new-password">Fjalëkalimi i Ri</Label>
                      <div className="relative mt-1">
                        <Input
                          id="forgot-new-password"
                          type={showForgotPassword ? 'text' : 'password'}
                          value={forgotNewPassword}
                          onChange={e => setForgotNewPassword(e.target.value)}
                          placeholder="Minimum 6 karaktere"
                          className="h-11 pr-10"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(!showForgotPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showForgotPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="forgot-confirm-password">Konfirmo Fjalëkalimin</Label>
                      <Input
                        id="forgot-confirm-password"
                        type="password"
                        value={forgotConfirmPassword}
                        onChange={e => setForgotConfirmPassword(e.target.value)}
                        placeholder="Përsëriteni fjalëkalimin"
                        className="mt-1 h-11"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={forgotLoading} className="w-full btn-orange h-11">
                      {forgotLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ndrysho Fjalëkalimin'}
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
