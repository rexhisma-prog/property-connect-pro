import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Eye, Phone, TrendingUp, Home } from 'lucide-react';

interface PropertyStat {
  id: string;
  title: string;
  city: string;
  views_count: number;
  contacts_count: number;
  status: string;
}

export default function Analytics() {
  const { user } = useAuth();
  const [properties, setProperties] = useState<PropertyStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from('properties')
        .select('id, title, city, views_count, contacts_count, status')
        .eq('user_id', user.id)
        .order('views_count', { ascending: false });
      setProperties(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const totalViews = properties.reduce((a, p) => a + (p.views_count || 0), 0);
  const totalContacts = properties.reduce((a, p) => a + (p.contacts_count || 0), 0);
  const activeCount = properties.filter(p => p.status === 'active').length;
  const ctr = totalViews > 0 ? ((totalContacts / totalViews) * 100).toFixed(1) : '0';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-8 w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Statistikat e Pronave</h1>
          <p className="text-muted-foreground mt-1">Shihni sa njerëz e kanë parë çdo pronë tuajën.</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Prona Totale', value: properties.length, icon: Home, color: 'text-primary', bg: 'bg-accent' },
            { label: 'Prona Aktive', value: activeCount, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Shikime Totale', value: totalViews.toLocaleString(), icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Kontakte Totale', value: totalContacts.toLocaleString(), icon: Phone, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map(card => (
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
                  <p className="text-sm text-muted-foreground mt-0.5">{card.label}</p>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Properties table */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" /> Statistikat për Çdo Pronë
            </h2>
            {!loading && totalViews > 0 && (
              <span className="text-sm text-muted-foreground">CTR mesatar: <strong className="text-foreground">{ctr}%</strong></span>
            )}
          </div>

          {loading ? (
            <div className="p-8 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-secondary animate-pulse rounded" />)}
            </div>
          ) : properties.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-4xl mb-3">📊</p>
              <p className="font-medium text-foreground">Nuk keni prona ende</p>
              <p className="text-sm text-muted-foreground mt-1">Postoni pronën tuaj të parë për të parë statistikat.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-secondary">
                  <tr>
                    {['#', 'Prona', 'Qyteti', 'Statusi', 'Shikime', 'Kontakte', 'CTR'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {properties.map((p, i) => {
                    const pCtr = p.views_count > 0 ? ((p.contacts_count / p.views_count) * 100).toFixed(1) : '0';
                    return (
                      <tr key={p.id} className="hover:bg-secondary/50">
                        <td className="px-4 py-3 text-muted-foreground font-bold">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-foreground max-w-xs truncate">{p.title}</td>
                        <td className="px-4 py-3 text-muted-foreground">{p.city}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            p.status === 'active' ? 'bg-green-100 text-green-700' :
                            p.status === 'draft' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-secondary text-muted-foreground'
                          }`}>
                            {p.status === 'active' ? 'Aktive' : p.status === 'draft' ? 'Draft' : p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-blue-600 flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" /> {p.views_count}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-purple-600 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" /> {p.contacts_count}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground font-medium">{pCtr}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
