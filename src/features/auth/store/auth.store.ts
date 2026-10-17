import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, User } from '@/features/auth/types/auth.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setSession: (user: User, accessToken: string) => void;
  logout: () => void;
  switchRole: (role: Role) => void;
  updateProfile: (
    payload: Partial<Pick<User, 'name' | 'department' | 'company'>>
  ) => void;
}

const ROLE_DEMO_PROFILES: Record<
  Role,
  Pick<User, 'id' | 'name' | 'email' | 'department' | 'technicianId'>
> = {
  ADMIN: {
    id: 'usr-admin-01',
    name: 'Alejandro Mendoza',
    email: 'admin@demo.com',
    department: 'Dirección de Operaciones & TI',
    technicianId: undefined,
  },
  COORDINADOR: {
    id: 'usr-coord-02',
    name: 'Valeria Salazar',
    email: 'coordinador@demo.com',
    department: 'Coordinación y Despacho de Campo',
    technicianId: undefined,
  },
  SUPERVISOR: {
    id: 'usr-sup-03',
    name: 'Carlos Ibarra',
    email: 'supervisor@demo.com',
    department: 'Supervisión de Calidad y SLA',
    technicianId: undefined,
  },
  TECNICO: {
    id: 'usr-tech-01',
    name: 'Marco Antonio Quispe',
    email: 'tecnico@demo.com',
    department: 'Ingeniería de Campo — UPS & Redes',
    technicianId: 'tech-01',
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setSession: (user, accessToken) =>
        set({
          user,
          accessToken,
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),

      switchRole: (role) =>
        set((state) => {
          if (!state.user) return state;
          const profilePreset = ROLE_DEMO_PROFILES[role];
          return {
            user: {
              ...state.user,
              id: profilePreset.id,
              role,
              name: profilePreset.name,
              email: profilePreset.email,
              department: profilePreset.department,
              technicianId: profilePreset.technicianId,
            },
          };
        }),

      updateProfile: (payload) =>
        set((state) => {
          if (!state.user) return state;
          return {
            user: {
              ...state.user,
              ...payload,
            },
          };
        }),
    }),
    {
      name: 'sumaup360-auth-v2',
    }
  )
);
