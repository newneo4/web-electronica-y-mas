import { useState } from 'react';
import { KeyRound, Lock, ShieldCheck, Webhook } from 'lucide-react';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SecurityForm() {
  const { canManageCriticalSettings, role } = usePermissions();
  const [rotated, setRotated] = useState(false);

  if (!canManageCriticalSettings) {
    return (
      <Card className="border-amber-500/30">
        <CardHeader>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Lock className="h-4 w-4" />
            <CardTitle className="text-base">
              Configuración Crítica Restringida
            </CardTitle>
          </div>
          <CardDescription>
            Tu rol actual (<strong>{role}</strong>) no cuenta con privilegios
            para modificar llaves de API ERP ni políticas globales de seguridad.
            Utiliza el <strong>Dev RBAC Switcher</strong> del Header y cambia a{' '}
            <strong>ADMIN</strong> para desbloquear esta sección.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">
              Seguridad Crítica & Integración API Backend
            </CardTitle>
            <CardDescription>
              Parámetros exclusivos de nivel ADMIN para conexión REST/GraphQL y
              rotación de secretos.
            </CardDescription>
          </div>
          <Badge variant="success">Acceso ADMIN Verificado</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="api-endpoint">Endpoint Base Backend (VITE_API_URL)</Label>
          <div className="flex gap-2">
            <Input
              id="api-endpoint"
              defaultValue={
                import.meta.env.VITE_API_URL ||
                'https://api.b2b-electronica.demo/v1'
              }
              readOnly
              className="font-mono text-xs"
            />
            <Badge variant="outline" className="shrink-0">
              Axios Ready
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 pt-2 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Webhook className="h-4 w-4 text-primary" />
              <span>Webhook ERP Mayorista</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Sincronización de stock e inventario en tiempo real con SAP B1.
            </p>
            <Badge variant="success" className="mt-3">
              Conectado (TLS 1.3)
            </Badge>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span>Política de Interceptores JWT</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Auto-logout ante respuestas HTTP 401 y desvío a /unauthorized en
              403.
            </p>
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setRotated(true);
                  setTimeout(() => setRotated(false), 2500);
                }}
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span>
                  {rotated ? 'Secreto JWT Rotado ✓' : 'Rotar Signing Key'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
