import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, UserPlus } from 'lucide-react';
import { usersService } from '@/features/users/api/users.service';
import { UsersDataTable } from '@/features/users/components/UsersDataTable';
import { UserFormModal } from '@/features/users/components/UserFormModal';
import type {
  ManagedUser,
  UpsertUserPayload,
} from '@/features/users/types/user.types';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';

export function UsersListPage() {
  const queryClient = useQueryClient();
  const { canDeleteUsers, isCoordinator } = usePermissions();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<ManagedUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersService.getUsers,
  });

  const createMutation = useMutation({
    mutationFn: usersService.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsFormOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpsertUserPayload;
    }) => usersService.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsFormOpen(false);
      setEditingUser(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setUserToDelete(null);
    },
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const handleSubmitUser = (payload: UpsertUserPayload) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Directorio de Usuarios y RBAC"
        description="Administra cuentas de Coordinadores, Supervisores y Técnicos."
        actions={
          <Button size="sm" onClick={handleOpenCreate}>
            <UserPlus className="h-4 w-4" />
            <span>Nuevo Usuario</span>
          </Button>
        }
      />

      {isCoordinator && (
        <div className="flex items-center gap-2.5 rounded-[8px] border border-[#2B7A9B]/30 bg-[#2B7A9B]/10 px-4 py-3 text-[12px] text-[#2B7A9B]">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>
            Estás visualizando este módulo con rol <strong>COORDINADOR</strong>:
            puedes crear y editar usuarios, pero la eliminación definitiva de
            cuentas está reservada al rol <strong>ADMIN</strong>.
          </span>
        </div>
      )}

      <UsersDataTable
        users={data?.data ?? []}
        isLoading={isLoading}
        canDelete={canDeleteUsers}
        onEditUser={handleOpenEdit}
        onDeleteUser={(user) => setUserToDelete(user)}
      />

      <UserFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        initialUser={editingUser}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onSubmitUser={handleSubmitUser}
      />

      <ConfirmDialog
        open={Boolean(userToDelete)}
        onOpenChange={(open) => {
          if (!open) setUserToDelete(null);
        }}
        title="¿Eliminar cuenta corporativa?"
        description={`Se revocará inmediatamente el acceso de ${userToDelete?.name ?? ''} (${userToDelete?.email ?? ''}). Esta acción no se puede deshacer.`}
        confirmText="Eliminar Usuario"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (userToDelete) {
            deleteMutation.mutate(userToDelete.id);
          }
        }}
      />
    </div>
  );
}
