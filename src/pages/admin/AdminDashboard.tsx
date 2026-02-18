import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { Users, Home, Eye, TrendingUp, DollarSign, Megaphone } from 'lucide-react';

interface Stats {
  totalUsers: number;
  activeProperties: number;
  totalViews: number;
  totalRevenue: number;
  totalAds: number;
  blockedUsers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, activeProperties: 0, totalViews: 0,
    totalRevenue: 0, totalAds: 0, blockedUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [users, properties, views, creditRev, extraRev, ads, blocked] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }),
      supabase.from('properties').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('properties').select('views_count'),
      supabase.from('credit_transactions').select('amount_paid').eq('status', 'paid'),
      supabase.from('extra_transactions').select('amount_paid').eq('status', 'paid'),
      supabase.from('ads').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('users').select('id', { count: 'exact' }).eq('status', 'blocked'),
    ]);

    const totalViews = (views.data || []).reduce((a, p) => a + (p.views_count || 0), 0);
    const totalRevenue = [
      ...(creditRev.data || []),
      ...(extraRev.data || []),
    ].reduce((a, t) => a + Number(t.amount_paid || 0), 0);

    setStats({
      totalUsers: users.count || 0,
      activeProperties: properties.count || 0,
      totalViews,
      totalRevenue,
      totalAds: ads.count || 0,
      blockedUsers: blocked.count || 0,
    });
    setLoading(false);
  };

  const cards = [
    { label: 'Total Përdorues', value: stats.totalUsers, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Prona Aktive', value: stats.activeProperties, icon: Home, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Shikime Totale', value: stats.totalViews.toLocaleString(), icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Revenue Total', value: `€${stats.totalRevenue.toFixed(0)}`, icon: DollarSign, color: 'text-primary', bg: 'bg-accent' },
    { label: 'Reklama Aktive', value: stats.totalAds, icon: Megaphone, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Bllokuar', value: stats.blockedUsers, icon: Users, color: 'text-destructive', bg: 'bg-red-50' },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map(card => (
          <div key={card.label} className="stats-card">
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
          </div>
        ))}
      </div>

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
            <a key={item.to} href={item.to} className="flex items-center gap-2 p-3 bg-secondary rounded-lg text-sm font-medium hover:bg-border transition-colors">
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
