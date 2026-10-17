import type { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider actúa como límite de inicialización de sesión.
 * Cuando se conecte el backend real, aquí puede ejecutarse /auth/me al montar.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  return <>{children}</>;
}
