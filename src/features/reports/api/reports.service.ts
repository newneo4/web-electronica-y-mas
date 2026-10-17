import { fieldMockDb } from '@/lib/field-mock-db';
import type { Client, EnrichedVisit, Technician } from '@/types/field.types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ReportsDataResponse {
  visits: EnrichedVisit[];
  clients: Client[];
  technicians: Technician[];
}

export const reportsService = {
  getReportsData: async (): Promise<ReportsDataResponse> => {
    await delay(400);
    // return (await apiClient.get<ApiResponse<ReportsDataResponse>>('/reports/visits')).data.data;

    const state = fieldMockDb.getState();
    const visits = fieldMockDb.getEnrichedVisits();
    return {
      visits,
      clients: state.clients,
      technicians: state.technicians,
    };
  },
};
