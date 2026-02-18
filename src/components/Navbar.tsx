import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Home, PlusCircle, User, LogOut,
  Shield, CreditCard, Menu, X, Building2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';
import { Country } from '@/lib/supabase-types';


export default function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Extract country from current URL if on /properties
  const searchParams = new URLSearchParams(location.search);
  const currentCountry = location.pathname === '/properties' ? (searchParams.get('country') || '') : '';

  const handleCountryClick = (country: Country | '') => {
    const params = new URLSearchParams(location.search);
    if (country) params.set('country', country);
    else params.delete('country');
    params.delete('city'); // reset city on country change
    navigate(`/properties?${params.toString()}`);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <img src={logo} alt="ShitePronen.com" className="h-10 w-auto object-contain" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link to="/properties" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
              Prona
            </Link>
            {/* Country quick-filter in navbar */}
            <div className="flex items-center gap-0.5 ml-1 bg-secondary rounded-lg p-0.5">
              {[
                { value: '' as const, label: '🌍 Të gjitha' },
                { value: 'kosovo' as Country, label: '🇽🇰 Kosovë' },
                { value: 'albania' as Country, label: '🇦🇱 Shqipëri' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleCountryClick(opt.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    currentCountry === opt.value
                      ? 'bg-white text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Link to="/pricing" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
              Çmimet
            </Link>
            <Link to="/advertise" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
              Reklamo
            </Link>
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {user && profile ? (
              <>
                <Button asChild size="sm" className="hidden md:flex btn-orange gap-1.5">
                  <Link to="/dashboard/properties/new">
                    <PlusCircle className="w-4 h-4" />
                    Posto Pronë
                  </Link>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 border-border">
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground font-semibold">
                        {(profile.full_name || profile.email || '?')[0].toUpperCase()}
                      </div>
                      <span className="hidden md:block text-sm max-w-24 truncate">
                        {profile.full_name?.split(' ')[0] || 'Profili'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold truncate">{profile.full_name || 'Përdorues'}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                      <p className="text-xs text-primary font-medium mt-1">{profile.credits_remaining} kredite</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer">
                        <Home className="w-4 h-4 mr-2" /> Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/properties" className="cursor-pointer">
                        <Building2 className="w-4 h-4 mr-2" /> Pronat e Mia
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/credits" className="cursor-pointer">
                        <CreditCard className="w-4 h-4 mr-2" /> Blej Kredite
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard/profile" className="cursor-pointer">
                        <User className="w-4 h-4 mr-2" /> Profili
                      </Link>
                    </DropdownMenuItem>
                    {profile.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer text-primary font-medium">
                            <Shield className="w-4 h-4 mr-2" /> Admin Panel
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" /> Dil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Hyr</Link>
                </Button>
                <Button size="sm" className="btn-orange" asChild>
                  <Link to="/register">Regjistrohu</Link>
                </Button>
              </>
            )}

            {/* Mobile menu toggle */}
            <Button
              variant="ghost" size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 py-3 space-y-1">
          <Link to="/properties" className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileOpen(false)}>
            Prona
          </Link>
          <Link to="/pricing" className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileOpen(false)}>
            Çmimet
          </Link>
          <Link to="/advertise" className="block px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded-lg" onClick={() => setMobileOpen(false)}>
            Reklamo
          </Link>
          {user && (
            <Link to="/dashboard/properties/new" className="block px-3 py-2 text-sm font-medium text-primary hover:bg-accent rounded-lg" onClick={() => setMobileOpen(false)}>
              + Posto Pronë
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
