import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, Star, AlertCircle, Zap, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Property } from '@/lib/supabase-types';

export default function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => { fetchProperties(); }, [filter]);

  const fetchProperties = async () => {
    let query = supabase.from('properties').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter as any);
    const { data } = await query.limit(100);
    setProperties((data as Property[]) || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('properties').update({ status: status as any }).eq('id', id);
    toast.success('Statusi u ndryshua');
    fetchProperties();
  };

  const deleteProperty = async (id: string) => {
    if (!confirm('Konfirmoni fshirjen?')) return;
    await supabase.from('properties').delete().eq('id', id);
    setProperties(prev => prev.filter(p => p.id !== id));
    toast.success('Prona u fshi');
  };

  const activateExtra = async (property: Property, type: 'featured' | 'urgent' | 'boost', days: number) => {
    const now = new Date();
    let updateData: Record<string, unknown> = {};

    if (type === 'featured') {
      const until = new Date(now.getTime() + days * 86400000);
      updateData = { is_featured: true, featured_until: until.toISOString() };
    } else if (type === 'urgent') {
      const until = new Date(now.getTime() + days * 86400000);
      updateData = { is_urgent: true, urgent_until: until.toISOString() };
    } else if (type === 'boost') {
      updateData = { last_boosted_at: now.toISOString() };
    }

    const { error } = await supabase.from('properties').update(updateData).eq('id', property.id);
    if (error) {
      toast.error('Gabim: ' + error.message);
      return;
    }

    await supabase.from('extra_transactions').insert({
      user_id: property.user_id,
      property_id: property.id,
      amount_paid: 0,
      status: 'paid',
    });

    toast.success(`${type} u aktivizua nga admini për ${days || 1} ditë!`);
    fetchProperties();
  };

  const addCreditsManually = async (property: Property, credits: number) => {
    const { data: user } = await supabase.from('users').select('credits_remaining').eq('id', property.user_id).single();
    if (!user) {
      toast.error('Përdoruesi nuk u gjet');
      return;
    }
    await supabase.from('users').update({
      credits_remaining: user.credits_remaining + credits,
    }).eq('id', property.user_id);

    await supabase.from('credit_transactions').insert({
      user_id: property.user_id,
      credits_added: credits,
      amount_paid: 0,
      status: 'paid',
    });

    toast.success(`${credits} kredite u shtuan manualisht!`);
  };

  const filters = ['all', 'active', 'draft', 'blocked', 'archived'];

  return (
    <AdminLayout title="Menaxhimi i Pronave">
      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:bg-secondary'
            }`}
          >
            {f === 'all' ? 'Të gjitha' : f}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                {['Titulli', 'Qyteti', 'Çmimi', 'Statusi', 'Shikime', 'Data', 'Veprime'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-secondary rounded animate-pulse" /></td>
                  ))}</tr>
                ))
              ) : properties.map(p => (
                <tr key={p.id} className="hover:bg-secondary/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground truncate max-w-40">{p.title}</p>
                    <p className="text-xs text-muted-foreground capitalize">{p.property_type}</p>
                    <div className="flex gap-1 mt-1">
                      {p.is_featured && p.featured_until && new Date(p.featured_until) > new Date() && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">⭐ Featured</span>
                      )}
                      {p.is_urgent && p.urgent_until && new Date(p.urgent_until) > new Date() && (
                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">🔴 Urgent</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.city}</td>
                  <td className="px-4 py-3 font-semibold text-primary">
                    €{Number(p.price).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={p.status}
                      onChange={e => updateStatus(p.id, e.target.value)}
                      className="text-xs border border-border rounded px-2 py-1 bg-background"
                    >
                      {['draft', 'active', 'blocked', 'sold', 'rented', 'archived'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.views_count}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleDateString('sq-AL')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <Button size="sm" variant="ghost" className="h-7 px-2"
                        onClick={() => navigate(`/properties/${p.id}`)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-yellow-600"
                        title="Aktivizo Featured 30 ditë (cash)"
                        onClick={() => activateExtra(p, 'featured', 30)}>
                        <Star className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600"
                        title="Aktivizo Urgent 30 ditë (cash)"
                        onClick={() => activateExtra(p, 'urgent', 30)}>
                        <AlertCircle className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-blue-600"
                        title="Boost tani (cash)"
                        onClick={() => activateExtra(p, 'boost', 0)}>
                        <Zap className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-green-600"
                        title="Shto 1 kredit (cash)"
                        onClick={() => addCreditsManually(p, 1)}>
                        <CreditCard className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive"
                        onClick={() => deleteProperty(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {properties.length === 0 && !loading && (
          <div className="text-center py-10 text-muted-foreground">Nuk ka prona</div>
        )}
      </div>
    </AdminLayout>
  );
}
