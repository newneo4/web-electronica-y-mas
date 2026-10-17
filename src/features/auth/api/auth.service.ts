import { delay } from '@/lib/utils';
// import { apiClient } from '@/lib/api-client';
import type {
  AuthResponse,
  LoginCredentials,
  User,
} from '@/features/auth/types/auth.types';
import type { ApiResponse } from '@/types/api.types';

export const MOCK_AUTH_USERS: Record<string, User> = {
  'admin@demo.com': {
    id: 'usr-admin-01',
    name: 'Alejandro Mendoza',
    email: 'admin@demo.com',
    role: 'ADMIN',
    department: 'Dirección de Operaciones & TI',
    company: 'Electrónica & Más EIRL',
    lastLogin: new Date().toISOString(),
  },
  'coordinador@demo.com': {
    id: 'usr-coord-02',
    name: 'Valeria Salazar',
    email: 'coordinador@demo.com',
    role: 'COORDINADOR',
    department: 'Coordinación y Despacho de Campo',
    company: 'Electrónica & Más EIRL',
    lastLogin: new Date().toISOString(),
  },
  'supervisor@demo.com': {
    id: 'usr-sup-03',
    name: 'Carlos Ibarra',
    email: 'supervisor@demo.com',
    role: 'SUPERVISOR',
    department: 'Supervisión de Calidad y SLA',
    company: 'Electrónica & Más EIRL',
    lastLogin: new Date().toISOString(),
  },
  'tecnico@demo.com': {
    id: 'usr-tech-01',
    name: 'Marco Antonio Quispe',
    email: 'tecnico@demo.com',
    role: 'TECNICO',
    department: 'Ingeniería de Campo — UPS & Redes',
    company: 'Electrónica & Más EIRL',
    technicianId: 'tech-01',
    lastLogin: new Date().toISOString(),
  },
};

export const authService = {
  async login(
    credentials: LoginCredentials
  ): Promise<ApiResponse<AuthResponse>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    // return data;

    const normalizedEmail = credentials.email.trim().toLowerCase();
    const matchedUser = MOCK_AUTH_USERS[normalizedEmail];

    if (!matchedUser || credentials.password.length < 4) {
      throw new Error(
        'Credenciales inválidas. Usa uno de los usuarios demo (admin@demo.com, coordinador@demo.com, supervisor@demo.com o tecnico@demo.com).'
      );
    }

    return {
      data: {
        user: {
          ...matchedUser,
          lastLogin: new Date().toISOString(),
        },
        accessToken: `mock-jwt-token-${matchedUser.role.toLowerCase()}-${Date.now()}`,
      },
      message: 'Autenticación exitosa en SUMAUP360 Field',
      timestamp: new Date().toISOString(),
    };
  },
};
