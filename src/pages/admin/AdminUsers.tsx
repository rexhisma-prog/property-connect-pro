import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Shield, ShieldOff, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile } from '@/lib/supabase-types';

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    setUsers((data as UserProfile[]) || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: 'active' | 'blocked' | 'suspended') => {
    await supabase.from('users').update({ status }).eq('id', id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));
    toast.success(`Statusi u ndryshua: ${status}`);
  };

  const updateRole = async (id: string, role: 'user' | 'admin') => {
    await supabase.from('users').update({ role }).eq('id', id);
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
    toast.success(`Roli u ndryshua: ${role}`);
  };

  const filtered = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    blocked: 'bg-red-100 text-red-700',
    suspended: 'bg-yellow-100 text-yellow-700',
  };

  return (
    <AdminLayout title="Menaxhimi i Përdoruesve">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Kërko sipas email ose emrit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-left">
              <tr>
                {['Emri', 'Email', 'Roli', 'Statusi', 'Kredite', 'Regjistruar', 'Veprime'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-secondary rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : filtered.map(user => (
                <tr key={user.id} className="hover:bg-secondary/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-foreground">{user.full_name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={e => updateRole(user.id, e.target.value as any)}
                      className="text-xs border border-border rounded px-2 py-1 bg-background"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusBadge[user.status] || ''}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-primary">{user.credits_remaining}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(user.created_at).toLocaleDateString('sq-AL')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {user.status !== 'active' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-green-600"
                          onClick={() => updateStatus(user.id, 'active')}>
                          <Shield className="w-3 h-3" />
                        </Button>
                      )}
                      {user.status !== 'blocked' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-destructive"
                          onClick={() => updateStatus(user.id, 'blocked')}>
                          <ShieldOff className="w-3 h-3" />
                        </Button>
                      )}
                      {user.status !== 'suspended' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-yellow-600"
                          onClick={() => updateStatus(user.id, 'suspended')}>
                          <ShieldAlert className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && !loading && (
          <div className="text-center py-10 text-muted-foreground">Nuk u gjet asnjë përdorues</div>
        )}
      </div>
    </AdminLayout>
  );
}
