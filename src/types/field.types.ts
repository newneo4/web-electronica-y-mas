export type VisitStatus =
  | 'POR_PROGRAMAR'
  | 'PROGRAMADA'
  | 'EN_TRASLADO'
  | 'EN_CURSO'
  | 'PAUSADA'
  | 'COMPLETADA'
  | 'CON_PENDIENTES'
  | 'VENCIDA';

export type FrequencyType =
  | 'SEMANAL'
  | 'QUINCENAL'
  | 'MENSUAL'
  | 'PERSONALIZADA';

export interface Branch {
  id: string;
  clientId: string;
  name: string;
  address: string;
  zone: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Client {
  id: string;
  ruc: string;
  businessName: string;
  status: 'ACTIVO' | 'INACTIVO';
  branches: Branch[];
  createdAt: string;
}

export interface TechnicianWorkSchedule {
  days: number[]; // 1 (Lunes) a 6 (Sábado)
  startTime: string; // "08:30"
  endTime: string; // "18:00"
}

export interface Technician {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  specialties: string[];
  assignedZones: string[];
  workSchedule: TechnicianWorkSchedule;
  isActive: boolean;
}

export interface ChecklistItemTemplate {
  id: string;
  label: string;
  isRequired: boolean;
}

export interface ServicePlan {
  id: string;
  clientId: string;
  branchId: string;
  title: string;
  requiredSpecialty: string;
  frequency: FrequencyType;
  customIntervalDays?: number;
  startDate: string;
  estimatedDurationMinutes: number;
  checklistTemplate: ChecklistItemTemplate[];
  isActive: boolean;
}

export interface VisitRescheduleRecord {
  previousDate: string;
  previousStartTime?: string;
  newDate: string;
  newStartTime?: string;
  reason: string;
  changedBy: string;
  timestamp: string;
}

export interface VisitPause {
  startedAt: string;
  endedAt?: string;
  reason?: string;
}

export interface ChecklistResultItem {
  itemId: string;
  label: string;
  isRequired: boolean;
  completed: boolean;
  note?: string;
}

export interface VisitEvidence {
  id: string;
  url: string;
  caption?: string;
  createdAt: string;
}

export interface VisitSignOff {
  receiverName: string;
  receiverRole?: string;
  receiverDocument?: string;
  signatureDataUrl: string;
  signedAt: string;
}

export interface VisitExecution {
  transitStartedAt?: string;
  arrivedAt?: string;
  checkInCoordinates?: {
    lat: number;
    lng: number;
    accuracy: number;
  };
  gpsFallbackReason?: string;
  workStartedAt?: string;
  pauses: VisitPause[];
  workEndedAt?: string;
  effectiveWorkSeconds: number;
  transitSeconds: number;
  checklistResults: ChecklistResultItem[];
  diagnostics: string;
  solutionApplied: string;
  sparePartsUsed?: string;
  evidences: VisitEvidence[];
  signOff?: VisitSignOff;
  hasPendingIssues: boolean;
  pendingIssuesDescription?: string;
  supervisorReviewed?: boolean;
  supervisorNotes?: string;
}

export interface Visit {
  id: string;
  code: string;
  planId?: string;
  title: string;
  requiredSpecialty: string;
  estimatedDurationMinutes: number;
  clientId: string;
  branchId: string;
  technicianId?: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledStartTime?: string; // HH:mm
  scheduledEndTime?: string; // HH:mm
  status: VisitStatus;
  rescheduleHistory: VisitRescheduleRecord[];
  execution?: VisitExecution;
}

/**
 * Vista enriquecida de una visita con datos cruzados de Cliente, Sede y Técnico
 * para consumo directo en tablas de Dashboard, Agenda, Monitoreo y Reportes.
 */
export interface EnrichedVisit extends Visit {
  clientName: string;
  clientRuc: string;
  branchName: string;
  branchAddress: string;
  branchZone: string;
  branchContactName: string;
  branchContactPhone: string;
  branchCoordinates?: {
    lat: number;
    lng: number;
  };
  technicianName?: string;
  technicianPhone?: string;
}
