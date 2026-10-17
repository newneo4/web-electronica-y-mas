import type {
  Client,
  EnrichedVisit,
  ServicePlan,
} from '@/types/field.types';

export interface CreateClientPayload {
  ruc: string;
  businessName: string;
  branchName: string;
  branchAddress: string;
  branchZone: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
}

export interface CreateBranchPayload {
  name: string;
  address: string;
  zone: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
}

export type DuplicateCheckStatus =
  | 'NEW_RECORD'
  | 'EXISTING_RUC_NEW_BRANCH'
  | 'EXACT_BRANCH_DUPLICATE';

export type ImportResolutionAction = 'IMPORT' | 'UPDATE_MERGE' | 'SKIP';

export interface ExcelImportRow {
  rowNumber: number;
  ruc: string;
  businessName: string;
  branchName: string;
  branchAddress: string;
  branchZone: string;
  contactName: string;
  contactPhone: string;
  duplicateStatus: DuplicateCheckStatus;
  resolution: ImportResolutionAction;
}

export interface ImportBatchResult {
  createdClientsCount: number;
  addedBranchesCount: number;
  updatedBranchesCount: number;
  skippedCount: number;
}

export interface ClientProfileDetail {
  client: Client;
  servicePlans: ServicePlan[];
  visitsHistory: EnrichedVisit[];
}
