import { fieldMockDb } from '@/lib/field-mock-db';
import type {
  ChecklistResultItem,
  EnrichedVisit,
  VisitExecution,
  VisitSignOff,
} from '@/types/field.types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function ensureExecutionState(
  existing: VisitExecution | undefined,
  planChecklist: { id: string; label: string; isRequired: boolean }[]
): VisitExecution {
  const defaultChecklist: ChecklistResultItem[] = planChecklist.map((item) => ({
    itemId: item.id,
    label: item.label,
    isRequired: item.isRequired,
    completed: false,
  }));

  if (!existing) {
    return {
      pauses: [],
      effectiveWorkSeconds: 0,
      transitSeconds: 0,
      checklistResults: defaultChecklist,
      diagnostics: '',
      solutionApplied: '',
      evidences: [],
      hasPendingIssues: false,
    };
  }

  return {
    ...existing,
    checklistResults:
      existing.checklistResults.length > 0
        ? existing.checklistResults
        : defaultChecklist,
  };
}

export interface ConfirmArrivalPayload {
  visitId: string;
  coordinates?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  gpsFallbackReason?: string;
}

export interface PauseWorkPayload {
  visitId: string;
  reason: string;
  effectiveWorkSeconds: number;
}

export interface SaveProgressPayload {
  visitId: string;
  effectiveWorkSeconds: number;
  checklistResults: ChecklistResultItem[];
  diagnostics: string;
  solutionApplied: string;
  sparePartsUsed?: string;
}

export interface AddEvidencePayload {
  visitId: string;
  dataUrl: string;
  caption?: string;
}

export interface FinalizeVisitPayload {
  visitId: string;
  effectiveWorkSeconds: number;
  checklistResults: ChecklistResultItem[];
  diagnostics: string;
  solutionApplied: string;
  sparePartsUsed?: string;
  signOff: Omit<VisitSignOff, 'signedAt'>;
  finalStatus: 'COMPLETADA' | 'CON_PENDIENTES';
  pendingIssuesDescription?: string;
}

export const fieldExecutionService = {
  /**
   * CA-04: Retorna exclusivamente las visitas asignadas al técnico autenticado
   */
  getMyAssignedVisits: async (
    technicianId: string
  ): Promise<EnrichedVisit[]> => {
    await delay(400);
    // return (await apiClient.get<ApiResponse<EnrichedVisit[]>>('/field/my-visits')).data.data;

    const allVisits = fieldMockDb.getEnrichedVisits();
    return allVisits.filter((v) => v.technicianId === technicianId);
  },

  /**
   * CA-04 & CA-05: Obtiene el detalle de una visita validando que pertenezca al técnico
   * e inicializando la plantilla de checklist si aún no tenía ejecución previa.
   */
  getVisitDetailForTechnician: async (
    visitId: string,
    technicianId: string
  ): Promise<EnrichedVisit> => {
    await delay(400);
    // return (await apiClient.get<ApiResponse<EnrichedVisit>>(`/field/visits/${visitId}`)).data.data;

    const state = fieldMockDb.getState();
    const rawVisit = state.visits.find((v) => v.id === visitId);
    if (!rawVisit) {
      throw new Error('La orden de visita solicitada no existe.');
    }
    if (rawVisit.technicianId !== technicianId) {
      throw new Error(
        'Acceso denegado (CA-04): Esta orden pertenece a otro técnico.'
      );
    }

    const plan = state.servicePlans.find((p) => p.id === rawVisit.planId);
    const defaultChecklist = plan?.checklistTemplate ?? [
      {
        id: 'chk-gen-1',
        label: 'Inspección visual de gabinete y acometida eléctrica',
        isRequired: true,
      },
      {
        id: 'chk-gen-2',
        label: 'Medición de parámetros de voltaje y carga operativa',
        isRequired: true,
      },
      {
        id: 'chk-gen-3',
        label: 'Limpieza técnica y ajuste de borneras',
        isRequired: false,
      },
    ];

    if (
      !rawVisit.execution ||
      rawVisit.execution.checklistResults.length === 0
    ) {
      fieldMockDb.updateState((prev) => ({
        ...prev,
        visits: prev.visits.map((v) =>
          v.id === visitId
            ? {
                ...v,
                execution: ensureExecutionState(v.execution, defaultChecklist),
              }
            : v
        ),
      }));
    }

    const enriched = fieldMockDb
      .getEnrichedVisits()
      .find((v) => v.id === visitId);
    if (!enriched) {
      throw new Error('No se pudo cargar la visita enriquecida.');
    }
    return enriched;
  },

  /**
   * Paso 2: Iniciar traslado a sede (cambia a EN_TRASLADO)
   */
  startTransit: async (visitId: string): Promise<EnrichedVisit> => {
    await delay(400);
    // return (await apiClient.post<ApiResponse<EnrichedVisit>>(`/field/visits/${visitId}/start-transit`)).data.data;

    const nowIso = new Date().toISOString();
    fieldMockDb.updateState((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => {
        if (v.id !== visitId) return v;
        const plan = prev.servicePlans.find((p) => p.id === v.planId);
        const exec = ensureExecutionState(
          v.execution,
          plan?.checklistTemplate ?? []
        );
        return {
          ...v,
          status: 'EN_TRASLADO',
          execution: {
            ...exec,
            transitStartedAt: exec.transitStartedAt ?? nowIso,
          },
        };
      }),
    }));

    return fieldMockDb.getEnrichedVisits().find((v) => v.id === visitId)!;
  },

  /**
   * Paso 2b: Confirmar llegada a sede con GPS o contingencia no bloqueante
   */
  confirmArrival: async (
    payload: ConfirmArrivalPayload
  ): Promise<EnrichedVisit> => {
    await delay(400);
    // return (await apiClient.post<ApiResponse<EnrichedVisit>>(`/field/visits/${payload.visitId}/confirm-arrival`, payload)).data.data;

    const now = new Date();
    const nowIso = now.toISOString();

    fieldMockDb.updateState((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => {
        if (v.id !== payload.visitId) return v;
        const plan = prev.servicePlans.find((p) => p.id === v.planId);
        const exec = ensureExecutionState(
          v.execution,
          plan?.checklistTemplate ?? []
        );
        const transitStartMs = exec.transitStartedAt
          ? new Date(exec.transitStartedAt).getTime()
          : now.getTime() - 1200 * 1000;
        const computedTransitSeconds = Math.max(
          60,
          Math.round((now.getTime() - transitStartMs) / 1000)
        );

        return {
          ...v,
          execution: {
            ...exec,
            transitStartedAt: exec.transitStartedAt ?? nowIso,
            arrivedAt: nowIso,
            transitSeconds: computedTransitSeconds,
            checkInCoordinates: payload.coordinates,
            gpsFallbackReason: payload.gpsFallbackReason,
          },
        };
      }),
    }));

    return fieldMockDb
      .getEnrichedVisits()
      .find((v) => v.id === payload.visitId)!;
  },

  /**
   * Paso 3: Iniciar atención efectiva en sitio (cambia a EN_CURSO)
   */
  startWork: async (visitId: string): Promise<EnrichedVisit> => {
    await delay(400);
    // return (await apiClient.post<ApiResponse<EnrichedVisit>>(`/field/visits/${visitId}/start-work`)).data.data;

    const nowIso = new Date().toISOString();
    fieldMockDb.updateState((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => {
        if (v.id !== visitId) return v;
        const plan = prev.servicePlans.find((p) => p.id === v.planId);
        const exec = ensureExecutionState(
          v.execution,
          plan?.checklistTemplate ?? []
        );
        return {
          ...v,
          status: 'EN_CURSO',
          execution: {
            ...exec,
            transitStartedAt: exec.transitStartedAt ?? nowIso,
            arrivedAt: exec.arrivedAt ?? nowIso,
            workStartedAt: exec.workStartedAt ?? nowIso,
          },
        };
      }),
    }));

    return fieldMockDb.getEnrichedVisits().find((v) => v.id === visitId)!;
  },

  /**
   * Paso 3b: Pausar trabajo registrando motivo (cambia a PAUSADA)
   */
  pauseWork: async (payload: PauseWorkPayload): Promise<EnrichedVisit> => {
    await delay(400);
    // return (await apiClient.post<ApiResponse<EnrichedVisit>>(`/field/visits/${payload.visitId}/pause`, payload)).data.data;

    const nowIso = new Date().toISOString();
    fieldMockDb.updateState((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => {
        if (v.id !== payload.visitId) return v;
        const plan = prev.servicePlans.find((p) => p.id === v.planId);
        const exec = ensureExecutionState(
          v.execution,
          plan?.checklistTemplate ?? []
        );
        return {
          ...v,
          status: 'PAUSADA',
          execution: {
            ...exec,
            effectiveWorkSeconds: payload.effectiveWorkSeconds,
            pauses: [
              ...exec.pauses,
              {
                startedAt: nowIso,
                reason: payload.reason.trim() || 'Pausa operativa en sede',
              },
            ],
          },
        };
      }),
    }));

    return fieldMockDb
      .getEnrichedVisits()
      .find((v) => v.id === payload.visitId)!;
  },

  /**
   * Paso 3c: Reanudar trabajo tras pausa (vuelve a EN_CURSO)
   */
  resumeWork: async (visitId: string): Promise<EnrichedVisit> => {
    await delay(400);
    // return (await apiClient.post<ApiResponse<EnrichedVisit>>(`/field/visits/${visitId}/resume`)).data.data;

    const nowIso = new Date().toISOString();
    fieldMockDb.updateState((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => {
        if (v.id !== visitId) return v;
        const plan = prev.servicePlans.find((p) => p.id === v.planId);
        const exec = ensureExecutionState(
          v.execution,
          plan?.checklistTemplate ?? []
        );
        const updatedPauses = exec.pauses.map((p, idx) =>
          idx === exec.pauses.length - 1 && !p.endedAt
            ? { ...p, endedAt: nowIso }
            : p
        );
        return {
          ...v,
          status: 'EN_CURSO',
          execution: {
            ...exec,
            pauses: updatedPauses,
          },
        };
      }),
    }));

    return fieldMockDb.getEnrichedVisits().find((v) => v.id === visitId)!;
  },

  /**
   * Paso 4: Guardar avance de checklist e informe técnico
   */
  saveTechnicalProgress: async (
    payload: SaveProgressPayload
  ): Promise<EnrichedVisit> => {
    await delay(400);
    // return (await apiClient.patch<ApiResponse<EnrichedVisit>>(`/field/visits/${payload.visitId}/progress`, payload)).data.data;

    fieldMockDb.updateState((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => {
        if (v.id !== payload.visitId) return v;
        const plan = prev.servicePlans.find((p) => p.id === v.planId);
        const exec = ensureExecutionState(
          v.execution,
          plan?.checklistTemplate ?? []
        );
        return {
          ...v,
          execution: {
            ...exec,
            effectiveWorkSeconds: payload.effectiveWorkSeconds,
            checklistResults: payload.checklistResults,
            diagnostics: payload.diagnostics,
            solutionApplied: payload.solutionApplied,
            sparePartsUsed: payload.sparePartsUsed,
          },
        };
      }),
    }));

    return fieldMockDb
      .getEnrichedVisits()
      .find((v) => v.id === payload.visitId)!;
  },

  /**
   * Paso 5: Adjuntar fotografía comprimida en cliente
   */
  addPhotoEvidence: async (
    payload: AddEvidencePayload
  ): Promise<EnrichedVisit> => {
    await delay(400);
    // return (await apiClient.post<ApiResponse<EnrichedVisit>>(`/field/visits/${payload.visitId}/evidences`, payload)).data.data;

    const newEvidence = {
      id: `ev-${Date.now()}`,
      url: payload.dataUrl,
      caption: payload.caption?.trim() || 'Evidencia fotográfica en sede',
      createdAt: new Date().toISOString(),
    };

    fieldMockDb.updateState((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => {
        if (v.id !== payload.visitId) return v;
        const plan = prev.servicePlans.find((p) => p.id === v.planId);
        const exec = ensureExecutionState(
          v.execution,
          plan?.checklistTemplate ?? []
        );
        return {
          ...v,
          execution: {
            ...exec,
            evidences: [...exec.evidences, newEvidence],
          },
        };
      }),
    }));

    return fieldMockDb
      .getEnrichedVisits()
      .find((v) => v.id === payload.visitId)!;
  },

  removePhotoEvidence: async (payload: {
    visitId: string;
    evidenceId: string;
  }): Promise<EnrichedVisit> => {
    await delay(300);
    // return (await apiClient.delete<ApiResponse<EnrichedVisit>>(`/field/visits/${payload.visitId}/evidences/${payload.evidenceId}`)).data.data;

    fieldMockDb.updateState((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => {
        if (v.id !== payload.visitId || !v.execution) return v;
        return {
          ...v,
          execution: {
            ...v.execution,
            evidences: v.execution.evidences.filter(
              (ev) => ev.id !== payload.evidenceId
            ),
          },
        };
      }),
    }));

    return fieldMockDb
      .getEnrichedVisits()
      .find((v) => v.id === payload.visitId)!;
  },

  /**
   * Pasos 6 y 7 (CA-05): Cierre de visita con firma digital y estado COMPLETADA o CON_PENDIENTES
   */
  finalizeVisit: async (
    payload: FinalizeVisitPayload
  ): Promise<EnrichedVisit> => {
    await delay(400);
    // return (await apiClient.post<ApiResponse<EnrichedVisit>>(`/field/visits/${payload.visitId}/finalize`, payload)).data.data;

    const nowIso = new Date().toISOString();

    fieldMockDb.updateState((prev) => ({
      ...prev,
      visits: prev.visits.map((v) => {
        if (v.id !== payload.visitId) return v;
        const plan = prev.servicePlans.find((p) => p.id === v.planId);
        const exec = ensureExecutionState(
          v.execution,
          plan?.checklistTemplate ?? []
        );
        return {
          ...v,
          status: payload.finalStatus,
          execution: {
            ...exec,
            workEndedAt: nowIso,
            effectiveWorkSeconds: Math.max(60, payload.effectiveWorkSeconds),
            checklistResults: payload.checklistResults,
            diagnostics: payload.diagnostics.trim(),
            solutionApplied: payload.solutionApplied.trim(),
            sparePartsUsed: payload.sparePartsUsed?.trim(),
            signOff: {
              ...payload.signOff,
              signedAt: nowIso,
            },
            hasPendingIssues: payload.finalStatus === 'CON_PENDIENTES',
            pendingIssuesDescription:
              payload.finalStatus === 'CON_PENDIENTES'
                ? payload.pendingIssuesDescription?.trim()
                : undefined,
          },
        };
      }),
    }));

    return fieldMockDb
      .getEnrichedVisits()
      .find((v) => v.id === payload.visitId)!;
  },
};
