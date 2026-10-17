import { delay } from '@/lib/utils';
// import { apiClient } from '@/lib/api-client';
import { fieldMockDb } from '@/lib/field-mock-db';
import type { ApiResponse, PaginatedResponse } from '@/types/api.types';
import type {
  ChecklistItemTemplate,
  FrequencyType,
  ServicePlan,
} from '@/types/field.types';

export interface CreateServicePlanPayload {
  clientId: string;
  branchId: string;
  title: string;
  requiredSpecialty: string;
  frequency: FrequencyType;
  startDate: string;
  estimatedDurationMinutes: number;
  checklistTemplate: ChecklistItemTemplate[];
}

export interface EnrichedServicePlan extends ServicePlan {
  clientName: string;
  branchName: string;
  branchZone: string;
}

export const servicePlansService = {
  async getServicePlans(): Promise<PaginatedResponse<EnrichedServicePlan>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.get<PaginatedResponse<EnrichedServicePlan>>('/service-plans');
    // return data;

    const state = fieldMockDb.getState();
    const enriched: EnrichedServicePlan[] = state.servicePlans.map((plan) => {
      const client = state.clients.find((c) => c.id === plan.clientId);
      const branch = client?.branches.find((b) => b.id === plan.branchId);
      return {
        ...plan,
        clientName: client?.businessName ?? 'Cliente',
        branchName: branch?.name ?? 'Sede',
        branchZone: branch?.zone ?? 'Lima',
      };
    });

    return {
      data: enriched,
      meta: {
        total: enriched.length,
        page: 1,
        pageSize: enriched.length,
        totalPages: 1,
      },
    };
  },

  async createServicePlan(
    payload: CreateServicePlanPayload
  ): Promise<ApiResponse<ServicePlan>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.post<ApiResponse<ServicePlan>>('/service-plans', payload);
    // return data;

    const newPlan: ServicePlan = {
      id: `plan-${Date.now().toString().slice(-4)}`,
      ...payload,
      isActive: true,
    };

    fieldMockDb.updateState((prev) => ({
      ...prev,
      servicePlans: [newPlan, ...prev.servicePlans],
    }));

    return {
      data: newPlan,
      message: 'Plan de servicio preventivo registrado exitosamente',
      timestamp: new Date().toISOString(),
    };
  },
};
