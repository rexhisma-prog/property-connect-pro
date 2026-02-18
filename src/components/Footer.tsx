import { Link } from 'react-router-dom';
import { Building2, Facebook, Instagram, Twitter, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-foreground text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">
                shite<span className="text-primary">pronen</span>.com
              </span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed">
              Platforma #1 e pronave të paluajtshme në Kosovë dhe Shqipëri. Shit, bli, qiraje me siguri.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-primary flex items-center justify-center transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Linke */}
          <div>
            <h3 className="font-semibold mb-4">Platforma</h3>
            <ul className="space-y-2">
              {[
                { to: '/properties', label: 'Shiko Prona' },
                { to: '/pricing', label: 'Çmimet' },
                { to: '/advertise', label: 'Reklamo' },
                { to: '/register', label: 'Regjistrohu' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-white/60 hover:text-white hover:text-primary transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="font-semibold mb-4">Informata</h3>
            <ul className="space-y-2">
              {[
                { to: '/terms', label: 'Kushtet e Shërbimit' },
                { to: '/privacy', label: 'Politika e Privatësisë' },
                { to: '/contact', label: 'Kontakti' },
                { to: '/faq', label: 'FAQ' },
              ].map(l => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-white/60 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <h3 className="font-semibold mb-4">Kontakti</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-white/60">
                <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                info@shitepronen.com
              </li>
              <li className="flex items-center gap-2 text-sm text-white/60">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                +383 44 000 000
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">© 2024 ShitëPronen.com. Të gjitha të drejtat e rezervuara.</p>
          <p className="text-xs text-white/40">Bërë me ❤️ për Kosovë & Shqipëri</p>
        </div>
      </div>
    </footer>
  );
}
