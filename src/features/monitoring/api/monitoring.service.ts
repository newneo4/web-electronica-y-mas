import { fieldMockDb } from '@/lib/field-mock-db';
import type { Client, EnrichedVisit, Technician } from '@/types/field.types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface LiveMonitoringResponse {
  visits: EnrichedVisit[];
  technicians: Technician[];
  clients: Client[];
}

export interface ResolvePendingVisitInput {
  visitId: string;
  supervisorNotes: string;
  closeAsCompleted: boolean;
}

export const monitoringService = {
  getLiveMonitoringData: async (): Promise<LiveMonitoringResponse> => {
    await delay(400);
    // return (await apiClient.get<ApiResponse<LiveMonitoringResponse>>('/monitoring/live')).data.data;

    const state = fieldMockDb.getState();
    const visits = fieldMockDb.getEnrichedVisits();
    return {
      visits,
      technicians: state.technicians,
      clients: state.clients,
    };
  },

  resolvePendingVisit: async (
    payload: ResolvePendingVisitInput
  ): Promise<EnrichedVisit> => {
    await delay(400);
    // return (await apiClient.patch<ApiResponse<EnrichedVisit>>(`/monitoring/visits/${payload.visitId}/resolve`, payload)).data.data;

    fieldMockDb.updateState((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => {
        if (v.id !== payload.visitId) return v;
        return {
          ...v,
          status: payload.closeAsCompleted ? 'COMPLETADA' : v.status,
          execution: v.execution
            ? {
                ...v.execution,
                supervisorReviewed: true,
                supervisorNotes: payload.supervisorNotes.trim(),
                hasPendingIssues: payload.closeAsCompleted
                  ? false
                  : v.execution.hasPendingIssues,
              }
            : {
                pauses: [],
                effectiveWorkSeconds: 0,
                transitSeconds: 0,
                checklistResults: [],
                diagnostics: '',
                solutionApplied: '',
                evidences: [],
                hasPendingIssues: !payload.closeAsCompleted,
                supervisorReviewed: true,
                supervisorNotes: payload.supervisorNotes.trim(),
              },
        };
      }),
    }));

    const updated = fieldMockDb
      .getEnrichedVisits()
      .find((v) => v.id === payload.visitId);
    if (!updated) {
      throw new Error('Visita no encontrada tras actualizar seguimiento.');
    }
    return updated;
  },
};
