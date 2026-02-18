import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { Users, Home, Eye, DollarSign, Megaphone, ShoppingBag, TrendingUp, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Stats {
  totalUsers: number;
  activeProperties: number;
  propertiesForSale: number;
  propertiesForRent: number;
  totalViews: number;
  totalRevenue: number;
  creditRevenue: number;
  extraRevenue: number;
  totalAds: number;
  blockedUsers: number;
  recentUsers: { id: string; email: string; full_name: string | null; created_at: string; credits_remaining: number }[];
  recentPayments: { id: string; amount_paid: number; created_at: string; credits_added: number; status: string }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, activeProperties: 0, propertiesForSale: 0, propertiesForRent: 0,
    totalViews: 0, totalRevenue: 0, creditRevenue: 0, extraRevenue: 0,
    totalAds: 0, blockedUsers: 0, recentUsers: [], recentPayments: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    const [users, forSale, forRent, views, creditRev, extraRev, ads, blocked, recentUsers, recentPayments] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('properties').select('id', { count: 'exact' }).eq('status', 'active').eq('listing_type', 'shitje'),
      supabase.from('properties').select('id', { count: 'exact' }).eq('status', 'active').eq('listing_type', 'qira'),
      supabase.from('properties').select('views_count'),
      supabase.from('credit_transactions').select('amount_paid').eq('status', 'paid'),
      supabase.from('extra_transactions').select('amount_paid').eq('status', 'paid'),
      supabase.from('ads').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('users').select('id', { count: 'exact' }).eq('status', 'blocked'),
      supabase.from('users').select('id, email, full_name, created_at, credits_remaining').order('created_at', { ascending: false }).limit(8),
      supabase.from('credit_transactions').select('id, amount_paid, created_at, credits_added, status').order('created_at', { ascending: false }).limit(8),
    ]);

    const totalViews = (views.data || []).reduce((a, p) => a + (p.views_count || 0), 0);
    const creditRevTotal = (creditRev.data || []).reduce((a, t) => a + Number(t.amount_paid || 0), 0);
    const extraRevTotal = (extraRev.data || []).reduce((a, t) => a + Number(t.amount_paid || 0), 0);

    setStats({
      totalUsers: users.count || 0,
      activeProperties: (forSale.count || 0) + (forRent.count || 0),
      propertiesForSale: forSale.count || 0,
      propertiesForRent: forRent.count || 0,
      totalViews,
      totalRevenue: creditRevTotal + extraRevTotal,
      creditRevenue: creditRevTotal,
      extraRevenue: extraRevTotal,
      totalAds: ads.count || 0,
      blockedUsers: blocked.count || 0,
      recentUsers: (recentUsers.data || []) as Stats['recentUsers'],
      recentPayments: (recentPayments.data || []) as Stats['recentPayments'],
    });
    setLoading(false);
  };

  const topCards = [
    { label: 'Total Përdorues', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', href: '/admin/users' },
    { label: 'Prona në Shitje', value: stats.propertiesForSale, icon: Home, color: 'text-green-600', bg: 'bg-green-50', href: '/admin/properties' },
    { label: 'Prona me Qira', value: stats.propertiesForRent, icon: ShoppingBag, color: 'text-violet-600', bg: 'bg-violet-50', href: '/admin/properties' },
    { label: 'Revenue Total', value: `€${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50', href: '#' },
    { label: 'Shikime Totale', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50', href: '/admin/analytics' },
    { label: 'Reklama Aktive', value: stats.totalAds, icon: Megaphone, color: 'text-rose-600', bg: 'bg-rose-50', href: '/admin/ads' },
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {topCards.map(card => (
          <Link to={card.href} key={card.label} className="stats-card hover:border-primary/30 transition-colors block">
            {loading ? (
              <div className="animate-pulse space-y-2">
                <div className="h-10 w-10 bg-secondary rounded-lg" />
                <div className="h-6 bg-secondary rounded w-16" />
                <div className="h-4 bg-secondary rounded w-24" />
              </div>
            ) : (
              <>
                <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center mb-3`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm text-muted-foreground">{card.label}</p>
              </>
            )}
          </Link>
        ))}
      </div>

      {/* Revenue breakdown */}
      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Breakdown Pagesave</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-secondary/40 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Nga Kredite</p>
            <p className="text-xl font-bold text-foreground">€{stats.creditRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-secondary/40 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">Nga Ekstra (Featured/Urgent/Boost)</p>
            <p className="text-xl font-bold text-foreground">€{stats.extraRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Recent Users */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" /> Regjistrimet e Fundit</h2>
            <Link to="/admin/users" className="text-xs text-primary hover:underline">Shiko të gjithë</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-secondary animate-pulse rounded" />)}</div>
          ) : stats.recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Asnjë përdorues i regjistruar.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{u.full_name || 'Pa emër'}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString('sq-AL')}</p>
                    <p className="text-xs text-primary font-medium">{u.credits_remaining} kredite</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold flex items-center gap-2"><DollarSign className="w-4 h-4 text-primary" /> Pagesat e Fundit</h2>
          </div>
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-secondary animate-pulse rounded" />)}</div>
          ) : stats.recentPayments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Asnjë pagesë ende.</p>
          ) : (
            <div className="space-y-2">
              {stats.recentPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">+{p.credits_added} kredite</p>
                    <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('sq-AL')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">€{Number(p.amount_paid).toFixed(2)}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {p.status === 'paid' ? 'Paguar' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Nav */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h2 className="font-semibold mb-4">Navigim i Shpejtë</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { to: '/admin/users', label: '👥 Menaxho Përdoruesit' },
            { to: '/admin/properties', label: '🏠 Menaxho Pronat' },
            { to: '/admin/ads', label: '📢 Menaxho Reklamat' },
            { to: '/admin/keywords', label: '🔑 Keywords Bllokimi' },
            { to: '/admin/analytics', label: '📊 Analitika' },
            { to: '/admin/credit-packages', label: '💳 Paketat Kredite' },
          ].map(item => (
            <Link key={item.to} to={item.to} className="flex items-center gap-2 p-3 bg-secondary rounded-lg text-sm font-medium hover:bg-border transition-colors">
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
