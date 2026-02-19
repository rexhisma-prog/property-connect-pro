import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CreditCard, Home, TrendingUp, Plus, Eye, Phone, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const { profile } = useAuth();

  const stats = [
    { label: 'Kredite Aktive', value: profile?.credits_remaining ?? 0, icon: CreditCard, color: 'text-primary', bg: 'bg-accent' },
    { label: 'Prona Aktive', value: '—', icon: Home, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Shikimet Totale', value: '—', icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Kontaktet', value: '—', icon: Phone, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  const quickActions = [
    { to: '/dashboard/properties/new', label: 'Posto Pronë të Re', icon: Plus, primary: true },
    { to: '/dashboard/properties', label: 'Pronat e Mia', icon: Home, primary: false },
    { to: '/dashboard/credits', label: 'Blej Kredite', icon: CreditCard, primary: false },
    { to: '/admin/analytics', label: 'Statistikat', icon: BarChart3, primary: false },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Mirë se vini, {profile?.full_name?.split(' ')[0] || 'Përdorues'}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Këtu mund të menaxhoni të gjitha pronat dhe aktivitetin tuaj.</p>
        </div>

        {/* Credits Alert */}
        {profile?.credits_remaining === 0 && (
          <div className="bg-accent border border-primary/20 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="font-semibold text-foreground">Kredite të shpenzuara!</p>
              <p className="text-sm text-muted-foreground">Blini kredite për të postuar prona të reja.</p>
            </div>
            <Button asChild size="sm" className="btn-orange flex-shrink-0">
              <Link to="/dashboard/credits">Blej Kredite</Link>
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(stat => (
            <div key={stat.label} className="stats-card">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Veprime të Shpejta</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map(action => (
              <Link
                key={action.to}
                to={action.to}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all hover:-translate-y-0.5 ${
                  action.primary 
                    ? 'bg-primary text-primary-foreground border-primary hover:brightness-110' 
                    : 'bg-card border-border hover:border-primary/30 hover:shadow-sm'
                }`}
              >
                <action.icon className="w-6 h-6" />
                <span className="text-sm font-medium text-center leading-tight">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Properties placeholder */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Pronat e Fundit</h2>
            <Link to="/dashboard/properties" className="text-sm text-primary hover:underline">Shiko të gjitha</Link>
          </div>
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <p className="text-4xl mb-3">🏠</p>
            <p className="font-medium text-foreground">Nuk keni prona të postuara ende</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Postoni pronën tuaj të parë dhe filloni të merrni kontakte</p>
            <Button asChild size="sm" className="btn-orange">
              <Link to="/dashboard/properties/new">
                <Plus className="w-4 h-4 mr-1.5" /> Posto Pronë
              </Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
