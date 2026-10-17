import type { EnrichedVisit } from '@/types/field.types';

export interface DailyDashboardSummary {
  totalToday: number;
  toScheduleCount: number;
  inProgressCount: number;
  completedCount: number;
  overdueCount: number;
}

export type TechnicianLivePresence = 'LIBRE' | 'EN_TRASLADO' | 'EN_SEDE';

export interface TechnicianWorkloadItem {
  technicianId: string;
  fullName: string;
  specialties: string[];
  assignedZones: string[];
  todayAssignedCount: number;
  todayCompletedCount: number;
  presence: TechnicianLivePresence;
  activeClientBranch?: string;
}

export interface DailyDashboardData {
  date: string;
  summary: DailyDashboardSummary;
  todayVisits: EnrichedVisit[];
  technicianWorkloads: TechnicianWorkloadItem[];
}
