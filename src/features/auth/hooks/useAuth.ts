import { useAuthStore } from '@/features/auth/store/auth.store';

export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setSession = useAuthStore((state) => state.setSession);
  const logout = useAuthStore((state) => state.logout);
  const switchRole = useAuthStore((state) => state.switchRole);
  const updateProfile = useAuthStore((state) => state.updateProfile);

  return {
    user,
    accessToken,
    isAuthenticated,
    setSession,
    logout,
    switchRole,
    updateProfile,
  };
}
