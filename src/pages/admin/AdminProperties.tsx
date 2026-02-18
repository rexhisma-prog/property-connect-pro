import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Property } from '@/lib/supabase-types';

export default function AdminProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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

  const statusColors: Record<string, string> = {
    active: 'default',
    draft: 'secondary',
    blocked: 'destructive',
    sold: 'secondary',
    archived: 'secondary',
  };

  const filters = ['all', 'active', 'draft', 'blocked', 'archived'];

  return (
    <AdminLayout title="Menaxhimi i Pronave">
      {/* Filter Tabs */}
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
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" asChild className="h-7 px-2">
                        <a href={`/properties/${p.id}`} target="_blank">
                          <Eye className="w-3.5 h-3.5" />
                        </a>
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
