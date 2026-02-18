import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Power } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminKeywords() {
  const [keywords, setKeywords] = useState<any[]>([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [flags, setFlags] = useState<any[]>([]);

  useEffect(() => {
    fetchKeywords();
    fetchFlags();
  }, []);

  const fetchKeywords = async () => {
    const { data } = await supabase.from('blocked_keywords').select('*').order('created_at', { ascending: false });
    setKeywords(data || []);
    setLoading(false);
  };

  const fetchFlags = async () => {
    const { data } = await supabase
      .from('agency_flags')
      .select('*, users!agency_flags_user_id_fkey(email, full_name)')
      .order('created_at', { ascending: false })
      .limit(20);
    setFlags(data || []);
  };

  const addKeyword = async () => {
    const kw = newKeyword.trim().toLowerCase();
    if (!kw) return;
    const { error } = await supabase.from('blocked_keywords').insert({ keyword: kw });
    if (error) {
      toast.error('Gabim: ' + error.message);
    } else {
      toast.success('Keyword u shtua');
      setNewKeyword('');
      fetchKeywords();
    }
  };

  const toggleKeyword = async (id: string, current: boolean) => {
    await supabase.from('blocked_keywords').update({ is_active: !current }).eq('id', id);
    setKeywords(prev => prev.map(k => k.id === id ? { ...k, is_active: !current } : k));
  };

  const deleteKeyword = async (id: string) => {
    await supabase.from('blocked_keywords').delete().eq('id', id);
    setKeywords(prev => prev.filter(k => k.id !== id));
    toast.success('Keyword u fshi');
  };

  return (
    <AdminLayout title="Keyword Blocking">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keywords */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Fjalë Kyçe të Bllokuara ({keywords.length})</h2>

          {/* Add */}
          <div className="flex gap-2 mb-4">
            <Input
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              placeholder="Shto keyword të re..."
              onKeyDown={e => e.key === 'Enter' && addKeyword()}
              className="flex-1"
            />
            <Button onClick={addKeyword} className="btn-orange gap-1.5">
              <Plus className="w-4 h-4" /> Shto
            </Button>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-secondary rounded-lg animate-pulse" />
              ))
            ) : keywords.map(kw => (
              <div key={kw.id} className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border ${kw.is_active ? 'border-border bg-background' : 'border-border bg-secondary opacity-60'}`}>
                <span className={`text-sm font-mono ${kw.is_active ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                  {kw.keyword}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleKeyword(kw.id, kw.is_active)}
                    className={`p-1 rounded ${kw.is_active ? 'text-green-600 hover:bg-green-50' : 'text-muted-foreground hover:bg-secondary'}`}
                    title={kw.is_active ? 'Çaktivizo' : 'Aktivizo'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteKeyword(kw.id)}
                    className="p-1 rounded text-destructive hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flags */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Flags të Fundit ({flags.length})</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {flags.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">Nuk ka flags</p>
            ) : flags.map((flag: any) => (
              <div key={flag.id} className="border border-border rounded-lg p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{flag.users?.email || flag.user_id}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{flag.reason}</p>
                    <p className="text-xs mt-1">
                      Keyword: <span className="font-mono text-destructive font-semibold">{flag.matched_keyword}</span>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(flag.created_at).toLocaleDateString('sq-AL')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
