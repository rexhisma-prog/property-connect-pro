import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { DollarSign, Eye, MousePointer, BarChart3, TrendingUp } from 'lucide-react';

export default function AdminAnalytics() {
  const [data, setData] = useState({
    totalRevenue: 0,
    creditRevenue: 0,
    extraRevenue: 0,
    adRevenue: 0,
    totalViews: 0,
    totalContacts: 0,
    adImpressions: 0,
    adClicks: 0,
    topProperties: [] as any[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    const [creditTxs, extraTxs, adTxs, props, adImp, adClk] = await Promise.all([
      supabase.from('credit_transactions').select('amount_paid').eq('status', 'paid'),
      supabase.from('extra_transactions').select('amount_paid').eq('status', 'paid'),
      supabase.from('ad_transactions').select('amount_paid').eq('status', 'paid'),
      supabase.from('properties').select('title, views_count, contacts_count, city').eq('status', 'active').order('views_count', { ascending: false }).limit(10),
      supabase.from('ad_events').select('id', { count: 'exact' }).eq('event_type', 'impression'),
      supabase.from('ad_events').select('id', { count: 'exact' }).eq('event_type', 'click'),
    ]);

    const sum = (arr: any[]) => arr.reduce((a, t) => a + Number(t.amount_paid || 0), 0);
    const creditRev = sum(creditTxs.data || []);
    const extraRev = sum(extraTxs.data || []);
    const adRev = sum(adTxs.data || []);
    const totalViews = (props.data || []).reduce((a, p) => a + (p.views_count || 0), 0);
    const totalContacts = (props.data || []).reduce((a, p) => a + (p.contacts_count || 0), 0);

    setData({
      totalRevenue: creditRev + extraRev + adRev,
      creditRevenue: creditRev,
      extraRevenue: extraRev,
      adRevenue: adRev,
      totalViews,
      totalContacts,
      adImpressions: adImp.count || 0,
      adClicks: adClk.count || 0,
      topProperties: props.data || [],
    });
    setLoading(false);
  };

  const ctr = data.adImpressions > 0 ? ((data.adClicks / data.adImpressions) * 100).toFixed(2) : '0';

  return (
    <AdminLayout title="Analitika & Statistika">
      {/* Revenue */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Revenue Total', value: `€${data.totalRevenue.toFixed(0)}`, icon: DollarSign, color: 'text-primary', bg: 'bg-accent' },
          { label: 'Kredite', value: `€${data.creditRevenue.toFixed(0)}`, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Extras', value: `€${data.extraRevenue.toFixed(0)}`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Reklama', value: `€${data.adRevenue.toFixed(0)}`, icon: BarChart3, color: 'text-green-600', bg: 'bg-green-50' },
        ].map(card => (
          <div key={card.label} className="stats-card">
            {loading ? <div className="animate-pulse space-y-2"><div className="h-10 w-10 bg-secondary rounded" /><div className="h-6 bg-secondary rounded w-16" /></div> : (
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

      {/* Engagement + Ads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> Engagement Pronave</h2>
          <div className="space-y-3">
            {[
              { label: 'Shikime Totale', value: data.totalViews.toLocaleString() },
              { label: 'Kontakte Totale', value: data.totalContacts.toLocaleString() },
              { label: 'CTR Mesatar', value: data.totalViews > 0 ? `${((data.totalContacts / data.totalViews) * 100).toFixed(1)}%` : '0%' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className="font-semibold text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><MousePointer className="w-4 h-4 text-primary" /> Statistikat e Reklamave</h2>
          <div className="space-y-3">
            {[
              { label: 'Impressions', value: data.adImpressions.toLocaleString() },
              { label: 'Clicks', value: data.adClicks.toLocaleString() },
              { label: 'CTR', value: `${ctr}%` },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <span className="font-semibold text-foreground">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Properties */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> Pronat Më të Shikuara</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr>
              {['#', 'Titulli', 'Qyteti', 'Shikime', 'Kontakte'].map(h => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.topProperties.map((p, i) => (
              <tr key={i} className="hover:bg-secondary/50">
                <td className="px-4 py-3 text-muted-foreground font-bold">{i + 1}</td>
                <td className="px-4 py-3 font-medium text-foreground truncate max-w-40">{p.title}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.city}</td>
                <td className="px-4 py-3 font-semibold text-primary">{p.views_count}</td>
                <td className="px-4 py-3 text-muted-foreground">{p.contacts_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
