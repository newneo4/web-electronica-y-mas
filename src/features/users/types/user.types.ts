import type { Role } from '@/features/auth/types/auth.types';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'PENDING';

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  status: UserStatus;
  createdAt: string;
  lastActive: string;
}

export interface UpsertUserPayload {
  name: string;
  email: string;
  role: Role;
  department: string;
  status: UserStatus;
}
