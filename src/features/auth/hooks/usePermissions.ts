import { useCallback } from 'react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import type { Role } from '@/features/auth/types/auth.types';

export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const currentRole = user?.role ?? null;

  const hasRole = useCallback(
    (allowedRoles?: Role[]): boolean => {
      if (!allowedRoles || allowedRoles.length === 0) return true;
      if (!currentRole) return false;
      return allowedRoles.includes(currentRole);
    },
    [currentRole]
  );

  return {
    role: currentRole,
    hasRole,
    isAdmin: currentRole === 'ADMIN',
    isCoordinator: currentRole === 'COORDINADOR',
    isSupervisor: currentRole === 'SUPERVISOR',
    isTechnician: currentRole === 'TECNICO',
    canAccessAdminPortal:
      currentRole === 'ADMIN' ||
      currentRole === 'COORDINADOR' ||
      currentRole === 'SUPERVISOR',
    canManageSchedulingAndPlans:
      currentRole === 'ADMIN' || currentRole === 'COORDINADOR',
    canViewUsers: currentRole === 'ADMIN' || currentRole === 'COORDINADOR',
    canEditUsers: currentRole === 'ADMIN' || currentRole === 'COORDINADOR',
    canDeleteUsers: currentRole === 'ADMIN',
    canManageCriticalSettings: currentRole === 'ADMIN',
  };
}
