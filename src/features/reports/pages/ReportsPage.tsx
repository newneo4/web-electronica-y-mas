import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Filter,
  RotateCcw,
  Truck,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { VisitStatusBadge } from '@/components/common/VisitStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { reportsService } from '../api/reports.service';
import type { EnrichedVisit } from '@/types/field.types';

function formatMinutes(seconds?: number): string {
  if (!seconds || seconds <= 0) return '—';
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

export function ReportsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'visits'],
    queryFn: reportsService.getReportsData,
  });

  const visits = data?.visits ?? [];
  const clients = data?.clients ?? [];
  const technicians = data?.technicians ?? [];

  // Filtros combinados (CA-07)
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [clientId, setClientId] = useState<string>('ALL');
  const [branchId, setBranchId] = useState<string>('ALL');
  const [technicianId, setTechnicianId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const availableBranches = useMemo(() => {
    if (clientId === 'ALL') {
      return clients.flatMap((c) => c.branches);
    }
    const found = clients.find((c) => c.id === clientId);
    return found ? found.branches : [];
  }, [clients, clientId]);

  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      if (dateFrom && visit.scheduledDate < dateFrom) return false;
      if (dateTo && visit.scheduledDate > dateTo) return false;
      if (clientId !== 'ALL' && visit.clientId !== clientId) return false;
      if (branchId !== 'ALL' && visit.branchId !== branchId) return false;
      if (technicianId !== 'ALL' && visit.technicianId !== technicianId)
        return false;
      if (statusFilter !== 'ALL' && visit.status !== statusFilter) return false;
      return true;
    });
  }, [visits, dateFrom, dateTo, clientId, branchId, technicianId, statusFilter]);

  // Métricas consolidadas de cumplimiento (CA-07)
  const metrics = useMemo(() => {
    const total = filteredVisits.length;
    const completed = filteredVisits.filter(
      (v) => v.status === 'COMPLETADA'
    ).length;
    const withExecution = filteredVisits.filter(
      (v) => v.execution && v.execution.effectiveWorkSeconds > 0
    );
    const withTransit = filteredVisits.filter(
      (v) => v.execution && v.execution.transitSeconds > 0
    );

    const complianceRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    const avgTransitMinutes =
      withTransit.length > 0
        ? Math.round(
            withTransit.reduce(
              (acc, v) => acc + (v.execution?.transitSeconds ?? 0),
              0
            ) /
              withTransit.length /
              60
          )
        : 0;

    const avgWorkMinutes =
      withExecution.length > 0
        ? Math.round(
            withExecution.reduce(
              (acc, v) => acc + (v.execution?.effectiveWorkSeconds ?? 0),
              0
            ) /
              withExecution.length /
              60
          )
        : 0;

    return {
      total,
      completed,
      complianceRate,
      avgTransitMinutes,
      avgWorkMinutes,
    };
  }, [filteredVisits]);

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setClientId('ALL');
    setBranchId('ALL');
    setTechnicianId('ALL');
    setStatusFilter('ALL');
  };

  const handleExportExcelCsv = () => {
    const headers = [
      'Codigo Orden',
      'Fecha Programada',
      'Hora Inicio',
      'Hora Fin',
      'RUC Cliente',
      'Razon Social',
      'Sede',
      'Zona',
      'Servicio / Plan',
      'Especialidad',
      'Tecnico Asignado',
      'Estado',
      'Duracion Estimada (min)',
      'Tiempo Traslado (min)',
      'Tiempo Efectivo (min)',
      'Receptor Conformidad',
      'Pendientes / Observaciones',
    ];

    const escapeCsv = (val: string | number | undefined) => {
      const str = String(val ?? '').replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = filteredVisits.map((v: EnrichedVisit) => [
      escapeCsv(v.code),
      escapeCsv(v.scheduledDate),
      escapeCsv(v.scheduledStartTime ?? ''),
      escapeCsv(v.scheduledEndTime ?? ''),
      escapeCsv(v.clientRuc),
      escapeCsv(v.clientName),
      escapeCsv(v.branchName),
      escapeCsv(v.branchZone),
      escapeCsv(v.title),
      escapeCsv(v.requiredSpecialty),
      escapeCsv(v.technicianName ?? 'Sin asignar'),
      escapeCsv(v.status),
      escapeCsv(v.estimatedDurationMinutes),
      escapeCsv(
        v.execution?.transitSeconds
          ? Math.round(v.execution.transitSeconds / 60)
          : 0
      ),
      escapeCsv(
        v.execution?.effectiveWorkSeconds
          ? Math.round(v.execution.effectiveWorkSeconds / 60)
          : 0
      ),
      escapeCsv(v.execution?.signOff?.receiverName ?? 'Pendiente'),
      escapeCsv(
        v.execution?.pendingIssuesDescription ??
          v.execution?.supervisorNotes ??
          ''
      ),
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `SUMAUP360_Reporte_Visitas_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes e Historial de Visitas (M08)"
        description="Análisis de cumplimiento operativo, auditoría de tiempos reales vs. estimados y exportación ejecutiva a Excel."
        actions={
          <Button
            onClick={handleExportExcelCsv}
            disabled={filteredVisits.length === 0}
            className="bg-[#0D6950] font-semibold text-white hover:bg-[#0B533E]"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar a Excel (.csv)
          </Button>
        }
      />

      {/* Tarjetas de Cumplimiento (ComplianceSummaryCards) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-[#E0E6E4] bg-white shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#78909C]">
                Cumplimiento de Visitas
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#0D6950]">
                {metrics.complianceRate}%
              </p>
              <p className="mt-0.5 text-xs text-[#78909C]">
                {metrics.completed} completadas de {metrics.total} filtradas
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#E6F2EF] text-[#0D6950]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E0E6E4] bg-white shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#78909C]">
                Tiempo Prom. Traslado
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#1F2926]">
                {metrics.avgTransitMinutes} min
              </p>
              <p className="mt-0.5 text-xs text-[#78909C]">
                Desde despacho hasta Check-In GPS
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F4F6F6] text-[#1F2926]">
              <Truck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E0E6E4] bg-white shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#78909C]">
                Tiempo Prom. Atención
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#0D6950]">
                {metrics.avgWorkMinutes} min
              </p>
              <p className="mt-0.5 text-xs text-[#78909C]">
                Trabajo efectivo en sede (sin pausas)
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#E6F2EF] text-[#0D6950]">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E0E6E4] bg-white shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#78909C]">
                Registros para Exportar
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#1F2926]">
                {metrics.total}
              </p>
              <p className="mt-0.5 text-xs text-[#78909C]">
                Formato CSV compatible con Excel
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#E6F2EF] text-[#0D6950]">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Panel de Filtros Multidimensionales (CA-07) */}
      <Card className="border-[#E0E6E4] bg-white shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-[#1F2926]">
              <Filter className="h-4 w-4 text-[#0D6950]" />
              Filtros de Auditoría e Historial
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-8 text-xs text-[#78909C] hover:text-[#1F2926]"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Limpiar filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="space-y-1">
              <Label className="text-xs text-[#78909C]">Fecha Desde</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-9 font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#78909C]">Fecha Hasta</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-9 font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#78909C]">Cliente B2B</Label>
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  setBranchId('ALL');
                }}
                className="h-9 w-full rounded-md border border-[#E0E6E4] bg-white px-2.5 text-xs font-medium text-[#1F2926] focus:border-[#0D6950] focus:outline-none"
              >
                <option value="ALL">Todos los clientes</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.businessName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#78909C]">Sede Operativa</Label>
              <select
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className="h-9 w-full rounded-md border border-[#E0E6E4] bg-white px-2.5 text-xs font-medium text-[#1F2926] focus:border-[#0D6950] focus:outline-none"
              >
                <option value="ALL">Todas las sedes</option>
                {availableBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#78909C]">Técnico</Label>
              <select
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
                className="h-9 w-full rounded-md border border-[#E0E6E4] bg-white px-2.5 text-xs font-medium text-[#1F2926] focus:border-[#0D6950] focus:outline-none"
              >
                <option value="ALL">Todos los técnicos</option>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-[#78909C]">Estado de Orden</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-9 w-full rounded-md border border-[#E0E6E4] bg-white px-2.5 text-xs font-medium text-[#1F2926] focus:border-[#0D6950] focus:outline-none"
              >
                <option value="ALL">Todos los estados</option>
                <option value="COMPLETADA">Completada</option>
                <option value="CON_PENDIENTES">Con Pendientes</option>
                <option value="EN_CURSO">En Curso</option>
                <option value="EN_TRASLADO">En Traslado</option>
                <option value="PROGRAMADA">Programada</option>
                <option value="POR_PROGRAMAR">Por Programar</option>
                <option value="VENCIDA">Vencida</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla Histórica de Visitas */}
      <Card className="border-[#E0E6E4] bg-white shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-[#1F2926]">
             Sábana Consolidada de Órdenes de Visita
          </CardTitle>
          <CardDescription className="text-xs text-[#78909C]">
            Comparativa de tiempos estimados vs. efectivos y conformidad en sede.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 animate-pulse rounded-md bg-[#F4F6F6]" />
          ) : filteredVisits.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#E0E6E4] p-10 text-center text-sm text-[#78909C]">
              No se encontraron visitas que coincidan con los filtros seleccionados.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#F4F6F6]/70">
                  <TableHead className="font-semibold text-[#1F2926]">
                    Código / Fecha
                  </TableHead>
                  <TableHead className="font-semibold text-[#1F2926]">
                    Cliente / Sede
                  </TableHead>
                  <TableHead className="font-semibold text-[#1F2926]">
                    Servicio / Técnico
                  </TableHead>
                  <TableHead className="font-semibold text-[#1F2926]">
                    Estado
                  </TableHead>
                  <TableHead className="font-semibold text-[#1F2926]">
                    Traslado
                  </TableHead>
                  <TableHead className="font-semibold text-[#1F2926]">
                    Efectivo / Est.
                  </TableHead>
                  <TableHead className="font-semibold text-[#1F2926]">
                    Conformidad
                  </TableHead>
                  <TableHead className="text-right font-semibold text-[#1F2926]">
                    Detalle
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.map((visit) => (
                  <TableRow key={visit.id} className="hover:bg-[#F4F6F6]/50">
                    <TableCell>
                      <div className="font-mono text-xs font-bold text-[#1F2926]">
                        {visit.code}
                      </div>
                      <div className="font-mono text-[11px] text-[#78909C]">
                        {visit.scheduledDate} {visit.scheduledStartTime ?? ''}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-bold text-[#1F2926]">
                        {visit.clientName}
                      </div>
                      <div className="text-[11px] text-[#78909C]">
                        {visit.branchName} ({visit.branchZone})
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium text-[#0D6950]">
                        {visit.title}
                      </div>
                      <div className="text-[11px] text-[#78909C]">
                        Téc: {visit.technicianName ?? 'Sin asignar'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <VisitStatusBadge status={visit.status} />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-[#1F2926]">
                      {formatMinutes(visit.execution?.transitSeconds)}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      <span className="font-bold text-[#0D6950]">
                        {formatMinutes(visit.execution?.effectiveWorkSeconds)}
                      </span>{' '}
                      <span className="text-[#78909C]">
                        / {visit.estimatedDurationMinutes} min
                      </span>
                    </TableCell>
                    <TableCell>
                      {visit.execution?.signOff ? (
                        <div className="text-xs">
                          <span className="font-semibold text-[#0D6950]">
                            Firmado
                          </span>
                          <p className="text-[11px] text-[#78909C]">
                            {visit.execution.signOff.receiverName}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-[#78909C]">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-semibold text-[#0D6950] hover:bg-[#E6F2EF]"
                      >
                        <Link to={`/admin/monitoring?visitId=${visit.id}`}>
                          <ExternalLink className="mr-1 h-3.5 w-3.5" />
                          Acta
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
