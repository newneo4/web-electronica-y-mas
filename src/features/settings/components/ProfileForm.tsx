import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CheckCircle2 } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const profileSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  department: z.string().min(2, 'El departamento es obligatorio'),
  company: z.string().min(2, 'El nombre de la empresa es obligatorio'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const { user, updateProfile } = useAuth();
  const [savedSuccess, setSavedSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? '',
      department: user?.department ?? '',
      company: user?.company ?? 'Electrónica & Más EIRL',
    },
  });

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile(values);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Perfil del Operador</CardTitle>
            <CardDescription>
              Información visible en auditorías de órdenes y registros B2B.
            </CardDescription>
          </div>
          <Badge variant="info">{user?.role}</Badge>
        </div>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Nombre Completo</Label>
              <Input id="profile-name" {...register('name')} />
              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-email">Correo (Solo lectura)</Label>
              <Input
                id="profile-email"
                value={user?.email ?? ''}
                disabled
                className="bg-muted/50"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-department">Departamento</Label>
              <Input id="profile-department" {...register('department')} />
              {errors.department && (
                <p className="text-xs text-destructive">
                  {errors.department.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="profile-company">Organización</Label>
              <Input id="profile-company" {...register('company')} />
              {errors.company && (
                <p className="text-xs text-destructive">
                  {errors.company.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t pt-4">
          <div>
            {savedSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                Perfil actualizado en la sesión activa
              </span>
            )}
          </div>
          <Button type="submit" size="sm" disabled={!isDirty && !savedSuccess}>
            Guardar Perfil
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
