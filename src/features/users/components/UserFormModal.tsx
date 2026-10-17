import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type {
  ManagedUser,
  UpsertUserPayload,
} from '@/features/users/types/user.types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const userFormSchema = z.object({
  name: z
    .string()
    .min(3, 'El nombre completo debe tener al menos 3 caracteres'),
  email: z
    .string()
    .min(1, 'El correo electrónico es obligatorio')
    .email('Formato de correo electrónico inválido'),
  department: z
    .string()
    .min(2, 'Especifica el área o departamento corporativo'),
  role: z.enum(['ADMIN', 'COORDINADOR', 'SUPERVISOR', 'TECNICO']),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING']),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUser: ManagedUser | null;
  isSubmitting: boolean;
  onSubmitUser: (payload: UpsertUserPayload) => void;
}

export function UserFormModal({
  open,
  onOpenChange,
  initialUser,
  isSubmitting,
  onSubmitUser,
}: UserFormModalProps) {
  const isEditing = Boolean(initialUser);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: '',
      email: '',
      department: '',
      role: 'COORDINADOR',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (initialUser) {
      reset({
        name: initialUser.name,
        email: initialUser.email,
        department: initialUser.department,
        role: initialUser.role,
        status: initialUser.status,
      });
    } else {
      reset({
        name: '',
        email: '',
        department: '',
        role: 'COORDINADOR',
        status: 'ACTIVE',
      });
    }
  }, [initialUser, open, reset]);

  const handleValidSubmit = (values: UserFormValues) => {
    onSubmitUser(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? 'Editar Usuario del Sistema'
              : 'Registrar Nuevo Usuario'}
          </DialogTitle>
          <DialogDescription>
            Configura las credenciales de directorio y el nivel de acceso RBAC.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(handleValidSubmit)}
          className="space-y-4 pt-2"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="user-name">Nombre Completo</Label>
            <Input
              id="user-name"
              placeholder="Ej. Roberto Méndez"
              disabled={isSubmitting}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-email">Correo Corporativo</Label>
            <Input
              id="user-email"
              type="email"
              placeholder="r.mendez@electronicaymas.pe"
              disabled={isSubmitting}
              {...register('email')}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-department">Departamento / Unidad</Label>
            <Input
              id="user-department"
              placeholder="Ej. Coordinación de Campo"
              disabled={isSubmitting}
              {...register('department')}
            />
            {errors.department && (
              <p className="text-xs text-destructive">
                {errors.department.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Rol de Sistema (RBAC)</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">ADMIN (Total)</SelectItem>
                      <SelectItem value="COORDINADOR">COORDINADOR</SelectItem>
                      <SelectItem value="SUPERVISOR">SUPERVISOR</SelectItem>
                      <SelectItem value="TECNICO">TECNICO (PWA)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Estado de Cuenta</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Activo</SelectItem>
                      <SelectItem value="PENDING">Pendiente</SelectItem>
                      <SelectItem value="INACTIVE">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Guardando (400ms)...'
                : isEditing
                  ? 'Guardar Cambios'
                  : 'Crear Usuario'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
