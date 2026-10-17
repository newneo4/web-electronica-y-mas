import { delay } from '@/lib/utils';
// import { apiClient } from '@/lib/api-client';
import type {
  ManagedUser,
  UpsertUserPayload,
} from '@/features/users/types/user.types';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';

const INITIAL_USERS: ManagedUser[] = [
  {
    id: 'usr-01',
    name: 'Alejandro Mendoza',
    email: 'admin@demo.com',
    role: 'ADMIN',
    department: 'Dirección de Operaciones & TI',
    status: 'ACTIVE',
    createdAt: '2025-01-12T10:00:00.000Z',
    lastActive: 'Hace 5 min',
  },
  {
    id: 'usr-02',
    name: 'Valeria Salazar',
    email: 'coordinador@demo.com',
    role: 'COORDINADOR',
    department: 'Coordinación y Despacho de Campo',
    status: 'ACTIVE',
    createdAt: '2025-02-04T14:20:00.000Z',
    lastActive: 'Hace 15 min',
  },
  {
    id: 'usr-03',
    name: 'Carlos Ibarra',
    email: 'supervisor@demo.com',
    role: 'SUPERVISOR',
    department: 'Supervisión de Calidad y SLA',
    status: 'ACTIVE',
    createdAt: '2025-03-19T09:15:00.000Z',
    lastActive: 'Hace 40 min',
  },
  {
    id: 'usr-04',
    name: 'Marco Antonio Quispe',
    email: 'tecnico@demo.com',
    role: 'TECNICO',
    department: 'Ingeniería de Campo — UPS & Redes',
    status: 'ACTIVE',
    createdAt: '2025-05-10T11:30:00.000Z',
    lastActive: 'En sede San Isidro',
  },
  {
    id: 'usr-05',
    name: 'Luis Fernando Cáceres',
    email: 'l.caceres@electronicaymas.pe',
    role: 'TECNICO',
    department: 'Ingeniería de Campo — CCTV & Fibra',
    status: 'ACTIVE',
    createdAt: '2025-07-22T16:45:00.000Z',
    lastActive: 'En traslado a Callao',
  },
  {
    id: 'usr-06',
    name: 'Renato Gómez Huamán',
    email: 'r.gomez@electronicaymas.pe',
    role: 'TECNICO',
    department: 'Ingeniería de Campo — Tableros & ATS',
    status: 'ACTIVE',
    createdAt: '2025-08-14T08:10:00.000Z',
    lastActive: 'Hace 1 hora',
  },
];

let usersDb: ManagedUser[] = [...INITIAL_USERS];

export const usersService = {
  async getUsers(): Promise<PaginatedResponse<ManagedUser>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.get<PaginatedResponse<ManagedUser>>('/users');
    // return data;

    return {
      data: [...usersDb],
      meta: {
        total: usersDb.length,
        page: 1,
        pageSize: usersDb.length,
        totalPages: 1,
      },
    };
  },

  async createUser(
    payload: UpsertUserPayload
  ): Promise<ApiResponse<ManagedUser>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.post<ApiResponse<ManagedUser>>('/users', payload);
    // return data;

    const newUser: ManagedUser = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      ...payload,
      createdAt: new Date().toISOString(),
      lastActive: 'Recién creado',
    };

    usersDb = [newUser, ...usersDb];

    return {
      data: newUser,
      message: 'Usuario corporativo registrado correctamente',
      timestamp: new Date().toISOString(),
    };
  },

  async updateUser(
    id: string,
    payload: UpsertUserPayload
  ): Promise<ApiResponse<ManagedUser>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.put<ApiResponse<ManagedUser>>(`/users/${id}`, payload);
    // return data;

    const index = usersDb.findIndex((user) => user.id === id);
    if (index === -1) {
      throw new Error('No se encontró el usuario solicitado');
    }

    const updatedUser: ManagedUser = {
      ...usersDb[index],
      ...payload,
      lastActive: 'Actualizado ahora',
    };

    usersDb = usersDb.map((item) => (item.id === id ? updatedUser : item));

    return {
      data: updatedUser,
      message: 'Datos del usuario actualizados correctamente',
      timestamp: new Date().toISOString(),
    };
  },

  async deleteUser(id: string): Promise<ApiResponse<{ id: string }>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.delete<ApiResponse<{ id: string }>>(`/users/${id}`);
    // return data;

    usersDb = usersDb.filter((user) => user.id !== id);

    return {
      data: { id },
      message: 'Usuario eliminado del directorio corporativo',
      timestamp: new Date().toISOString(),
    };
  },
};
