import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function AdminSettings() {
  return (
    <AdminLayout title="Cilësimet">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Cilësimet e Platformës
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Cilësimet e platformës do të jenë të disponueshme së shpejti.</p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
