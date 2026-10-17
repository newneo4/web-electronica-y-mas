import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/app/router/ProtectedRoute';
import { RoleRoute } from '@/app/router/RoleRoute';
import { AppShell } from '@/components/layout/AppShell';
import { FieldPwaLayout } from '@/components/layout/FieldPwaLayout';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { ClientsListPage } from '@/features/clients/pages/ClientsListPage';
import { ClientProfilePage } from '@/features/clients/pages/ClientProfilePage';
import { TechniciansPage } from '@/features/technicians/pages/TechniciansPage';
import { ServicePlansPage } from '@/features/service-plans/pages/ServicePlansPage';
import { ScheduleDispatchPage } from '@/features/scheduling/pages/ScheduleDispatchPage';
import { FieldMonitoringPage } from '@/features/monitoring/pages/FieldMonitoringPage';
import { ReportsPage } from '@/features/reports/pages/ReportsPage';
import { MyAgendaPage } from '@/features/field-execution/pages/MyAgendaPage';
import { VisitExecutionWizardPage } from '@/features/field-execution/pages/VisitExecutionWizardPage';
import { UsersListPage } from '@/features/users/pages/UsersListPage';
import { SettingsPage } from '@/features/settings/pages/SettingsPage';
import { UnauthorizedPage } from '@/app/router/pages/UnauthorizedPage';
import { NotFoundPage } from '@/app/router/pages/NotFoundPage';
import { useAuthStore } from '@/features/auth/store/auth.store';

function RootRoleRedirect() {
  const user = useAuthStore((state) => state.user);
  if (user?.role === 'TECNICO') {
    return <Navigate to="/field/agenda" replace />;
  }
  return <Navigate to="/admin/dashboard" replace />;
}

export const appRouter = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        index: true,
        element: <RootRoleRedirect />,
      },
      {
        path: '/dashboard',
        element: <RootRoleRedirect />,
      },
      // =====================================================================
      // Entregable A: Sistema Web de Gestión (/admin/*)
      // Roles permitidos: ADMIN, COORDINADOR, SUPERVISOR (Bloqueado a TECNICO)
      // =====================================================================
      {
        path: '/admin',
        element: (
          <RoleRoute allowedRoles={['ADMIN', 'COORDINADOR', 'SUPERVISOR']}>
            <AppShell />
          </RoleRoute>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="/admin/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          {
            path: 'clients',
            element: <ClientsListPage />,
          },
          {
            path: 'clients/:clientId',
            element: <ClientProfilePage />,
          },
          {
            path: 'technicians',
            element: (
              <RoleRoute allowedRoles={['ADMIN', 'COORDINADOR']}>
                <TechniciansPage />
              </RoleRoute>
            ),
          },
          {
            path: 'service-plans',
            element: (
              <RoleRoute allowedRoles={['ADMIN', 'COORDINADOR']}>
                <ServicePlansPage />
              </RoleRoute>
            ),
          },
          {
            path: 'schedule',
            element: (
              <RoleRoute allowedRoles={['ADMIN', 'COORDINADOR']}>
                <ScheduleDispatchPage />
              </RoleRoute>
            ),
          },
          {
            path: 'monitoring',
            element: <FieldMonitoringPage />,
          },
          {
            path: 'reports',
            element: <ReportsPage />,
          },
          {
            path: 'users',
            element: (
              <RoleRoute allowedRoles={['ADMIN', 'COORDINADOR']}>
                <UsersListPage />
              </RoleRoute>
            ),
          },
          {
            path: 'settings',
            element: <SettingsPage />,
          },
        ],
      },
      // =====================================================================
      // Entregable B: App Móvil PWA para Técnicos (/field/*)
      // Rol permitido: TECNICO (CA-04 y CA-08)
      // =====================================================================
      {
        path: '/field',
        element: (
          <RoleRoute allowedRoles={['TECNICO']}>
            <FieldPwaLayout />
          </RoleRoute>
        ),
        children: [
          {
            index: true,
            element: <Navigate to="/field/agenda" replace />,
          },
          {
            path: 'agenda',
            element: <MyAgendaPage />,
          },
          {
            path: 'visits/:visitId',
            element: <VisitExecutionWizardPage />,
          },
        ],
      },
      {
        path: '/unauthorized',
        element: <UnauthorizedPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
