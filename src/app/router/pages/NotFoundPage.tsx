import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border bg-muted text-muted-foreground">
            <Compass className="h-6 w-6" />
          </div>
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Error 404
          </span>
          <CardTitle className="text-xl">Página no encontrada</CardTitle>
          <CardDescription>
            La ruta solicitada no existe o fue movida dentro del portal
            administrativo ElectroB2B.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link to="/admin/dashboard">
              <Home className="h-4 w-4" />
              <span>Ir al Inicio</span>
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
