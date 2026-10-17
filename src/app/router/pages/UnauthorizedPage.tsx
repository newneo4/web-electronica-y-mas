import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldOff } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function UnauthorizedPage() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-destructive/30 bg-destructive/10 text-destructive">
            <ShieldOff className="h-6 w-6" />
          </div>
          <Badge variant="destructive">HTTP 403 • Acceso Denegado</Badge>
          <CardTitle className="text-xl">
            Permisos Insuficientes para esta Ruta
          </CardTitle>
          <CardDescription>
            Tu sesión activa tiene asignado el rol{' '}
            <strong className="text-foreground">
              {user?.role ?? 'SIN ROL'}
            </strong>
            , el cual no está autorizado para acceder a este módulo.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground">
          Si estás probando el sistema RBAC en modo desarrollo, puedes cambiar
          tu rol entre <strong>ADMIN</strong>, <strong>COORDINADOR</strong>,{' '}
          <strong>SUPERVISOR</strong> y <strong>PWA TÉCNICO</strong> desde el
          selector <strong>Dev RBAC</strong> ubicado en la barra superior.
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link
              to={user?.role === 'TECNICO' ? '/field/agenda' : '/admin/dashboard'}
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a mi vista autorizada</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
