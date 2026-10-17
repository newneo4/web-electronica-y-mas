export type Role = 'ADMIN' | 'COORDINADOR' | 'SUPERVISOR' | 'TECNICO';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department: string;
  company: string;
  technicianId?: string;
  avatarUrl?: string;
  lastLogin: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}
