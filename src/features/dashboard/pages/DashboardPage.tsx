import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Activity, CalendarPlus, RefreshCw } from 'lucide-react';
import { dashboardService } from '@/features/dashboard/api/dashboard.service';
import { DailyKpiCards } from '@/features/dashboard/components/DailyKpiCards';
import { TodayVisitsTable } from '@/features/dashboard/components/TodayVisitsTable';
import { TechnicianWorkloadWidget } from '@/features/dashboard/components/TechnicianWorkloadWidget';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';

export function DashboardPage() {
  const { user } = useAuth();

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['dashboard-daily-overview'],
    queryFn: dashboardService.getDailyOverview,
  });

  const overview = data?.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tablero de Control Operativo del Día"
        description={`Electrónica & Más EIRL • Operador: ${user?.name} (${user?.role})`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`}
              />
              <span>Actualizar Tablero</span>
            </Button>
            <Button variant="default" size="sm" asChild>
              <Link to="/admin/schedule">
                <CalendarPlus className="h-3.5 w-3.5" />
                <span>Programar Visita</span>
              </Link>
            </Button>
            <Button variant="cta" size="sm" asChild>
              <Link to="/admin/monitoring">
                <Activity className="h-3.5 w-3.5" />
                <span>Monitoreo en Vivo</span>
              </Link>
            </Button>
          </>
        }
      />

      {/* 5 Tarjetas KPI del Día */}
      <DailyKpiCards summary={overview?.summary} isLoading={isLoading} />

      {/* Tabla de Visitas del Día + Widget de Carga de Técnicos */}
      <div className="grid gap-6 lg:grid-cols-7">
        <TodayVisitsTable
          visits={overview?.todayVisits}
          isLoading={isLoading}
        />
        <TechnicianWorkloadWidget
          workloads={overview?.technicianWorkloads}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
