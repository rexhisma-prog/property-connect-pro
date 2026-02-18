import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, Phone } from 'lucide-react';
import AdBanner from '@/components/AdBanner';
import logo from '@/assets/logo.png';

export default function Footer() {
  return (
    <footer className="bg-foreground text-white">
      {/* Ad Banner above footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <AdBanner position="homepage_middle" className="w-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-7">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center mb-3">
              <img src={logo} alt="ShitePronen.com" className="h-8 w-auto object-contain brightness-0 invert" />
            </Link>
            <p className="text-xs text-white/50 leading-relaxed mb-3">
              Platforma #1 e pronave në Kosovë dhe Shqipëri.
            </p>
            <div className="flex items-center gap-2">
              <a href="#" className="w-7 h-7 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-colors">
                <Facebook className="w-3.5 h-3.5" />
              </a>
              <a href="#" className="w-7 h-7 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-colors">
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a href="mailto:marketing@shitepronen.com" className="w-7 h-7 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-colors">
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Platforma */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Platforma</h3>
            <ul className="space-y-1.5">
              {[
                { to: '/properties', label: 'Shiko Prona' },
                { to: '/pricing', label: 'Çmimet' },
                { to: '/advertise', label: 'Reklamo' },
                { to: '/register', label: 'Regjistrohu' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-xs text-white/55 hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Informata</h3>
            <ul className="space-y-1.5">
              {[
                { to: '/terms', label: 'Kushtet' },
                { to: '/privacy', label: 'Privatësia' },
                { to: '/contact', label: 'Kontakti' },
                { to: '/faq', label: 'FAQ' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-xs text-white/55 hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Kontakti</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5 text-xs text-white/55">
                <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                marketing@shitepronen.com
              </li>
              <li className="flex items-center gap-1.5 text-xs text-white/55">
                <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                +383 44 000 000
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-white/35">© 2025 ShitëPronen.com. Të gjitha të drejtat e rezervuara.</p>
          <p className="text-xs text-white/35">Bërë me ❤️ për Kosovë & Shqipëri</p>
        </div>
      </div>
    </footer>
  );
}
