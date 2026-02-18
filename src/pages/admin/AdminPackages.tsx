import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Pencil, Check } from 'lucide-react';
import { CreditPackage, ExtraPackage } from '@/lib/supabase-types';

export default function AdminPackages() {
  const [creditPkgs, setCreditPkgs] = useState<CreditPackage[]>([]);
  const [extraPkgs, setExtraPkgs] = useState<ExtraPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCredit, setEditingCredit] = useState<Record<string, string>>({});
  const [editingExtra, setEditingExtra] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      supabase.from('credit_packages').select('*').order('credits_amount'),
      supabase.from('extra_packages').select('*').order('type'),
    ]).then(([c, e]) => {
      setCreditPkgs((c.data as CreditPackage[]) || []);
      setExtraPkgs((e.data as ExtraPackage[]) || []);
      setLoading(false);
    });
  }, []);

  const saveCreditPrice = async (id: string) => {
    const price = parseFloat(editingCredit[id]);
    if (isNaN(price)) return;
    await supabase.from('credit_packages').update({ price_eur: price }).eq('id', id);
    setCreditPkgs(prev => prev.map(p => p.id === id ? { ...p, price_eur: price } : p));
    setEditingCredit(prev => { const n = { ...prev }; delete n[id]; return n; });
    toast.success('Çmimi u ndryshua');
  };

  const saveExtraPrice = async (id: string) => {
    const price = parseFloat(editingExtra[id]);
    if (isNaN(price)) return;
    await supabase.from('extra_packages').update({ price_eur: price }).eq('id', id);
    setExtraPkgs(prev => prev.map(p => p.id === id ? { ...p, price_eur: price } : p));
    setEditingExtra(prev => { const n = { ...prev }; delete n[id]; return n; });
    toast.success('Çmimi u ndryshua');
  };

  return (
    <AdminLayout title="Menaxhimi i Paketave">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit Packages */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Paketat e Krediteve</h2>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-secondary rounded-lg animate-pulse" />
              ))
            ) : creditPkgs.map(pkg => (
              <div key={pkg.id} className="flex items-center justify-between gap-3 p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{pkg.name}</p>
                  <p className="text-xs text-muted-foreground">{pkg.credits_amount} kredite</p>
                </div>
                <div className="flex items-center gap-2">
                  {editingCredit[pkg.id] !== undefined ? (
                    <>
                      <Input
                        type="number"
                        value={editingCredit[pkg.id]}
                        onChange={e => setEditingCredit(prev => ({ ...prev, [pkg.id]: e.target.value }))}
                        className="w-20 h-8 text-sm"
                        step="0.01"
                      />
                      <Button size="sm" className="h-8 w-8 p-0 btn-orange" onClick={() => saveCreditPrice(pkg.id)}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-primary">€{pkg.price_eur}</span>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                        onClick={() => setEditingCredit(prev => ({ ...prev, [pkg.id]: String(pkg.price_eur) }))}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Extra Packages */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold mb-4">Paketat Extra</h2>
          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-secondary rounded-lg animate-pulse" />
              ))
            ) : extraPkgs.map(pkg => (
              <div key={pkg.id} className="flex items-center justify-between gap-3 p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{pkg.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{pkg.type} · {pkg.duration_days > 0 ? `${pkg.duration_days} ditë` : 'Menjëherë'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {editingExtra[pkg.id] !== undefined ? (
                    <>
                      <Input
                        type="number"
                        value={editingExtra[pkg.id]}
                        onChange={e => setEditingExtra(prev => ({ ...prev, [pkg.id]: e.target.value }))}
                        className="w-20 h-8 text-sm"
                        step="0.01"
                      />
                      <Button size="sm" className="h-8 w-8 p-0 btn-orange" onClick={() => saveExtraPrice(pkg.id)}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-primary">€{pkg.price_eur}</span>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"
                        onClick={() => setEditingExtra(prev => ({ ...prev, [pkg.id]: String(pkg.price_eur) }))}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
