import { delay } from '@/lib/utils';
// import { apiClient } from '@/lib/api-client';
import { fieldMockDb } from '@/lib/field-mock-db';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type { Technician } from '@/types/field.types';

export interface UpsertTechnicianPayload {
  id?: string;
  fullName: string;
  email: string;
  phone: string;
  specialties: string[];
  assignedZones: string[];
  startTime: string;
  endTime: string;
}

export const techniciansService = {
  async getTechnicians(): Promise<PaginatedResponse<Technician>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.get<PaginatedResponse<Technician>>('/technicians');
    // return data;

    const { technicians } = fieldMockDb.getState();
    return {
      data: technicians,
      meta: {
        total: technicians.length,
        page: 1,
        pageSize: technicians.length,
        totalPages: 1,
      },
    };
  },

  async upsertTechnician(
    payload: UpsertTechnicianPayload
  ): Promise<ApiResponse<Technician>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.post<ApiResponse<Technician>>('/technicians', payload);
    // return data;

    let savedTech!: Technician;

    fieldMockDb.updateState((prev) => {
      if (payload.id) {
        const updated = prev.technicians.map((tech) => {
          if (tech.id !== payload.id) return tech;
          savedTech = {
            ...tech,
            fullName: payload.fullName.trim(),
            email: payload.email.trim(),
            phone: payload.phone.trim(),
            specialties: payload.specialties,
            assignedZones: payload.assignedZones,
            workSchedule: {
              ...tech.workSchedule,
              startTime: payload.startTime,
              endTime: payload.endTime,
            },
          };
          return savedTech;
        });
        return { ...prev, technicians: updated };
      }

      const newId = `tech-${Date.now().toString().slice(-4)}`;
      savedTech = {
        id: newId,
        userId: `usr-${newId}`,
        fullName: payload.fullName.trim(),
        email: payload.email.trim(),
        phone: payload.phone.trim(),
        specialties: payload.specialties,
        assignedZones: payload.assignedZones,
        workSchedule: {
          days: [1, 2, 3, 4, 5, 6],
          startTime: payload.startTime,
          endTime: payload.endTime,
        },
        isActive: true,
      };

      return {
        ...prev,
        technicians: [savedTech, ...prev.technicians],
      };
    });

    return {
      data: savedTech,
      message: 'Ficha del técnico guardada correctamente',
      timestamp: new Date().toISOString(),
    };
  },

  async toggleTechnicianStatus(
    technicianId: string
  ): Promise<ApiResponse<Technician>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.patch<ApiResponse<Technician>>(`/technicians/${technicianId}/status`);
    // return data;

    let updatedTech!: Technician;

    fieldMockDb.updateState((prev) => ({
      ...prev,
      technicians: prev.technicians.map((tech) => {
        if (tech.id !== technicianId) return tech;
        updatedTech = {
          ...tech,
          isActive: !tech.isActive,
        };
        return updatedTech;
      }),
    }));

    return {
      data: updatedTech,
      message: 'Estado de acceso del técnico actualizado sin alterar su historial',
      timestamp: new Date().toISOString(),
    };
  },
};
