import { delay } from '@/lib/utils';
// import { apiClient } from '@/lib/api-client';
import { fieldMockDb, getTodayIsoDate } from '@/lib/field-mock-db';
import type {
  DailyDashboardData,
  TechnicianLivePresence,
  TechnicianWorkloadItem,
} from '@/features/dashboard/types/dashboard.types';
import type { ApiResponse } from '@/types/api.types';

export const dashboardService = {
  async getDailyOverview(): Promise<ApiResponse<DailyDashboardData>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.get<ApiResponse<DailyDashboardData>>('/admin/dashboard/today');
    // return data;

    const today = getTodayIsoDate();
    const allVisits = fieldMockDb.getEnrichedVisits();
    const state = fieldMockDb.getState();

    // Incluye las visitas programadas para hoy más las vencidas o por programar activas
    const todayAndActionableVisits = allVisits.filter(
      (v) =>
        v.scheduledDate === today ||
        v.status === 'VENCIDA' ||
        v.status === 'POR_PROGRAMAR'
    );

    const summary = {
      totalToday: todayAndActionableVisits.filter(
        (v) => v.scheduledDate === today
      ).length,
      toScheduleCount: allVisits.filter((v) => v.status === 'POR_PROGRAMAR')
        .length,
      inProgressCount: allVisits.filter(
        (v) =>
          v.status === 'EN_TRASLADO' ||
          v.status === 'EN_CURSO' ||
          v.status === 'PAUSADA'
      ).length,
      completedCount: allVisits.filter(
        (v) => v.status === 'COMPLETADA' || v.status === 'CON_PENDIENTES'
      ).length,
      overdueCount: allVisits.filter((v) => v.status === 'VENCIDA').length,
    };

    const technicianWorkloads: TechnicianWorkloadItem[] = state.technicians
      .filter((tech) => tech.isActive)
      .map((tech) => {
        const techVisitsToday = allVisits.filter(
          (v) => v.technicianId === tech.id && v.scheduledDate === today
        );

        const inSiteVisit = techVisitsToday.find(
          (v) => v.status === 'EN_CURSO' || v.status === 'PAUSADA'
        );
        const inTransitVisit = techVisitsToday.find(
          (v) => v.status === 'EN_TRASLADO'
        );

        let presence: TechnicianLivePresence = 'LIBRE';
        let activeClientBranch: string | undefined;

        if (inSiteVisit) {
          presence = 'EN_SEDE';
          activeClientBranch = `${inSiteVisit.clientName} (${inSiteVisit.branchName})`;
        } else if (inTransitVisit) {
          presence = 'EN_TRASLADO';
          activeClientBranch = `Rumbo a ${inTransitVisit.branchName}`;
        }

        return {
          technicianId: tech.id,
          fullName: tech.fullName,
          specialties: tech.specialties,
          assignedZones: tech.assignedZones,
          todayAssignedCount: techVisitsToday.length,
          todayCompletedCount: techVisitsToday.filter(
            (v) => v.status === 'COMPLETADA' || v.status === 'CON_PENDIENTES'
          ).length,
          presence,
          activeClientBranch,
        };
      });

    return {
      data: {
        date: today,
        summary,
        todayVisits: todayAndActionableVisits,
        technicianWorkloads,
      },
      timestamp: new Date().toISOString(),
    };
  },
};
