import { delay } from '@/lib/utils';
// import { apiClient } from '@/lib/api-client';
import { addDaysToIsoDate, fieldMockDb, getTodayIsoDate } from '@/lib/field-mock-db';
import type { ApiResponse } from '@/types/api.types';
import type {
  EnrichedVisit,
  ServicePlan,
  Technician,
  Visit,
} from '@/types/field.types';

export interface SchedulingOverviewData {
  visits: EnrichedVisit[];
  technicians: Technician[];
  servicePlans: ServicePlan[];
}

export interface GenerateRecurrencePayload {
  startDate: string;
  endDate: string;
}

export interface GenerateRecurrenceResult {
  createdCount: number;
  skippedDuplicatesCount: number;
  evaluatedPlansCount: number;
}

export interface AssignVisitPayload {
  visitId: string;
  technicianId: string;
  scheduledDate: string;
  scheduledStartTime: string;
}

export interface RescheduleVisitPayload {
  visitId: string;
  newDate: string;
  newStartTime: string;
  technicianId?: string;
  reason: string;
  changedBy: string;
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const h = String(Math.floor(clamped / 60)).padStart(2, '0');
  const m = String(clamped % 60).padStart(2, '0');
  return `${h}:${m}`;
}

export function addMinutesToTime(hhmm: string, durationMinutes: number): string {
  return minutesToTime(timeToMinutes(hhmm) + durationMinutes);
}

/**
 * Valida si un técnico tiene cruce horario con otra visita en la misma fecha
 * o si el rango cae fuera de su jornada laboral (CA-03).
 */
export function detectScheduleConflict(params: {
  technician: Technician;
  allVisits: EnrichedVisit[];
  excludeVisitId: string;
  scheduledDate: string;
  startTime: string;
  durationMinutes: number;
}): {
  hasOverlap: boolean;
  overlappingVisit?: EnrichedVisit;
  isOutsideWorkHours: boolean;
} {
  const {
    technician,
    allVisits,
    excludeVisitId,
    scheduledDate,
    startTime,
    durationMinutes,
  } = params;

  const startMin = timeToMinutes(startTime);
  const endMin = startMin + durationMinutes;

  const workStartMin = timeToMinutes(technician.workSchedule.startTime);
  const workEndMin = timeToMinutes(technician.workSchedule.endTime);

  const isOutsideWorkHours = startMin < workStartMin || endMin > workEndMin;

  const overlappingVisit = allVisits.find((visit) => {
    if (visit.id === excludeVisitId) return false;
    if (visit.technicianId !== technician.id) return false;
    if (visit.scheduledDate !== scheduledDate) return false;
    if (
      visit.status === 'POR_PROGRAMAR' ||
      visit.status === 'COMPLETADA' ||
      visit.status === 'CON_PENDIENTES'
    ) {
      return false;
    }
    if (!visit.scheduledStartTime) return false;

    const vStart = timeToMinutes(visit.scheduledStartTime);
    const vEnd = visit.scheduledEndTime
      ? timeToMinutes(visit.scheduledEndTime)
      : vStart + visit.estimatedDurationMinutes;

    return startMin < vEnd && endMin > vStart;
  });

  return {
    hasOverlap: Boolean(overlappingVisit),
    overlappingVisit,
    isOutsideWorkHours,
  };
}

export const schedulingService = {
  async getSchedulingData(): Promise<ApiResponse<SchedulingOverviewData>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.get<ApiResponse<SchedulingOverviewData>>('/admin/schedule');
    // return data;

    const state = fieldMockDb.getState();
    return {
      data: {
        visits: fieldMockDb.getEnrichedVisits(),
        technicians: state.technicians.filter((t) => t.isActive),
        servicePlans: state.servicePlans.filter((p) => p.isActive),
      },
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Generador Recurrente Idempotente (CA-02):
   * Si se ejecuta dos veces para el mismo rango de fechas y plan, omite las
   * visitas ya generadas y retorna skippedDuplicatesCount.
   */
  async generateRecurringVisits(
    payload: GenerateRecurrencePayload
  ): Promise<ApiResponse<GenerateRecurrenceResult>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.post<ApiResponse<GenerateRecurrenceResult>>('/visits/generate-recurring', payload);
    // return data;

    let createdCount = 0;
    let skippedDuplicatesCount = 0;
    const state = fieldMockDb.getState();
    const activePlans = state.servicePlans.filter((p) => p.isActive);

    fieldMockDb.updateState((prev) => {
      const nextVisits = [...prev.visits];

      activePlans.forEach((plan) => {
        const stepDays =
          plan.frequency === 'SEMANAL'
            ? 7
            : plan.frequency === 'QUINCENAL'
              ? 14
              : plan.frequency === 'MENSUAL'
                ? 30
                : plan.customIntervalDays ?? 15;

        let cursorDate = payload.startDate || getTodayIsoDate();
        const maxDate = payload.endDate || addDaysToIsoDate(cursorDate, 30);

        let safetyCounter = 0;
        while (cursorDate <= maxDate && safetyCounter < 12) {
          safetyCounter += 1;
          const alreadyExists = nextVisits.some(
            (v) => v.planId === plan.id && v.scheduledDate === cursorDate
          );

          if (alreadyExists) {
            skippedDuplicatesCount += 1;
          } else {
            const newVisit: Visit = {
              id: `vis-rec-${plan.id}-${cursorDate}-${Date.now().toString().slice(-3)}`,
              code: `VIS-2026-${String(nextVisits.length + 101).padStart(4, '0')}`,
              planId: plan.id,
              title: plan.title,
              requiredSpecialty: plan.requiredSpecialty,
              estimatedDurationMinutes: plan.estimatedDurationMinutes,
              clientId: plan.clientId,
              branchId: plan.branchId,
              scheduledDate: cursorDate,
              status: 'POR_PROGRAMAR',
              rescheduleHistory: [],
              execution: {
                pauses: [],
                effectiveWorkSeconds: 0,
                transitSeconds: 0,
                checklistResults: plan.checklistTemplate.map((item) => ({
                  itemId: item.id,
                  label: item.label,
                  isRequired: item.isRequired,
                  completed: false,
                })),
                diagnostics: '',
                solutionApplied: '',
                evidences: [],
                hasPendingIssues: false,
              },
            };
            nextVisits.push(newVisit);
            createdCount += 1;
          }

          cursorDate = addDaysToIsoDate(cursorDate, stepDays);
        }
      });

      return {
        ...prev,
        visits: nextVisits,
      };
    });

    return {
      data: {
        createdCount,
        skippedDuplicatesCount,
        evaluatedPlansCount: activePlans.length,
      },
      message: 'Generación recurrente idempotente ejecutada correctamente',
      timestamp: new Date().toISOString(),
    };
  },

  async assignVisit(
    payload: AssignVisitPayload
  ): Promise<ApiResponse<EnrichedVisit>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.patch<ApiResponse<EnrichedVisit>>(`/visits/${payload.visitId}/assign`, payload);
    // return data;

    let updatedVisit!: Visit;

    fieldMockDb.updateState((prev) => ({
      ...prev,
      visits: prev.visits.map((visit) => {
        if (visit.id !== payload.visitId) return visit;
        const endTime = addMinutesToTime(
          payload.scheduledStartTime,
          visit.estimatedDurationMinutes
        );
        updatedVisit = {
          ...visit,
          technicianId: payload.technicianId,
          scheduledDate: payload.scheduledDate,
          scheduledStartTime: payload.scheduledStartTime,
          scheduledEndTime: endTime,
          status: 'PROGRAMADA',
        };
        return updatedVisit;
      }),
    }));

    return {
      data: fieldMockDb.enrichVisit(updatedVisit),
      message: 'Técnico y horario asignados exitosamente',
      timestamp: new Date().toISOString(),
    };
  },

  async rescheduleVisit(
    payload: RescheduleVisitPayload
  ): Promise<ApiResponse<EnrichedVisit>> {
    await delay(400);

    // Llamada real lista para producción:
    // const { data } = await apiClient.patch<ApiResponse<EnrichedVisit>>(`/visits/${payload.visitId}/reschedule`, payload);
    // return data;

    let updatedVisit!: Visit;

    fieldMockDb.updateState((prev) => ({
      ...prev,
      visits: prev.visits.map((visit) => {
        if (visit.id !== payload.visitId) return visit;
        const endTime = addMinutesToTime(
          payload.newStartTime,
          visit.estimatedDurationMinutes
        );
        updatedVisit = {
          ...visit,
          technicianId: payload.technicianId ?? visit.technicianId,
          scheduledDate: payload.newDate,
          scheduledStartTime: payload.newStartTime,
          scheduledEndTime: endTime,
          status: 'PROGRAMADA',
          rescheduleHistory: [
            {
              previousDate: visit.scheduledDate,
              previousStartTime: visit.scheduledStartTime,
              newDate: payload.newDate,
              newStartTime: payload.newStartTime,
              reason: payload.reason.trim(),
              changedBy: payload.changedBy,
              timestamp: new Date().toISOString(),
            },
            ...visit.rescheduleHistory,
          ],
        };
        return updatedVisit;
      }),
    }));

    return {
      data: fieldMockDb.enrichVisit(updatedVisit),
      message: 'Visita reprogramada con registro de auditoría',
      timestamp: new Date().toISOString(),
    };
  },
};
