import {
  Activity,
  BarChart3,
  Building2,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/features/auth/types/auth.types';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  roles?: Role[];
  description: string;
}

/**
 * Mapa Oficial de Módulos Web ERP — SUMAUP360 Field (Sección 4 y 6 de la Especificación)
 */
export const NAVIGATION_ITEMS: NavItem[] = [
  {
    title: 'Tablero del Día',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'COORDINADOR', 'SUPERVISOR'],
    description: 'KPIs diarios, visitas del día y carga operativa de técnicos',
  },
  {
    title: 'Clientes y Sedes',
    href: '/admin/clients',
    icon: Building2,
    roles: ['ADMIN', 'COORDINADOR', 'SUPERVISOR'],
    description: 'Padrón de clientes, sedes, historial e importador Excel',
  },
  {
    title: 'Técnicos de Campo',
    href: '/admin/technicians',
    icon: Wrench,
    roles: ['ADMIN', 'COORDINADOR'],
    description: 'Personal técnico, especialidades, zonas y horarios',
  },
  {
    title: 'Planes Preventivos',
    href: '/admin/service-plans',
    icon: ClipboardList,
    roles: ['ADMIN', 'COORDINADOR'],
    description: 'Frecuencias de mantenimiento y constructor de checklists',
  },
  {
    title: 'Agenda y Despacho',
    href: '/admin/schedule',
    icon: CalendarClock,
    badge: 'Asistida',
    roles: ['ADMIN', 'COORDINADOR'],
    description: 'Generación recurrente idempotente, asignación y reprogramación',
  },
  {
    title: 'Monitoreo en Vivo',
    href: '/admin/monitoring',
    icon: Activity,
    badge: 'Live',
    roles: ['ADMIN', 'COORDINADOR', 'SUPERVISOR'],
    description: 'Supervisión en tiempo real y resolución de visitas con pendientes',
  },
  {
    title: 'Reportes y SLA',
    href: '/admin/reports',
    icon: BarChart3,
    roles: ['ADMIN', 'COORDINADOR', 'SUPERVISOR'],
    description: 'Indicadores de cumplimiento, tiempos y exportación CSV/Excel',
  },
  {
    title: 'Usuarios y Accesos',
    href: '/admin/users',
    icon: ShieldCheck,
    roles: ['ADMIN', 'COORDINADOR'],
    description: 'Administración de cuentas y roles RBAC del sistema',
  },
  {
    title: 'Configuración',
    href: '/admin/settings',
    icon: Settings,
    roles: ['ADMIN', 'COORDINADOR', 'SUPERVISOR'],
    description: 'Perfil corporativo, seguridad API y Design System',
  },
];
