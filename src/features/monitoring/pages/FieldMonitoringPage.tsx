import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  FileSignature,
  MapPin,
  Navigation,
  PauseCircle,
  Search,
  ShieldCheck,
  Truck,
  UserCheck,
  Wrench,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { monitoringService } from '../api/monitoring.service';
import type { EnrichedVisit, VisitStatus } from '@/types/field.types';

function formatSecondsToDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '00m 00s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
  }
  return `${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;
}

function formatIsoTime(iso?: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const BOARD_COLUMNS: {
  key: string;
  title: string;
  subtitle: string;
  statuses: VisitStatus[];
  accentClass: string;
}[] = [
  {
    key: 'ACTIVE_FIELD',
    title: 'En Campo Ahora',
    subtitle: 'En traslado, atención o pausa',
    statuses: ['EN_TRASLADO', 'EN_CURSO', 'PAUSADA'],
    accentClass: 'border-t-4 border-t-[#0D6950]',
  },
  {
    key: 'PENDING_ISSUES',
    title: 'Con Pendientes / Vencidas',
    subtitle: 'Requieren seguimiento o reprogramación',
    statuses: ['CON_PENDIENTES', 'VENCIDA'],
    accentClass: 'border-t-4 border-t-[#A8262B]',
  },
  {
    key: 'SCHEDULED',
    title: 'Programadas Próximas',
    subtitle: 'Asignadas listas para despacho',
    statuses: ['PROGRAMADA'],
    accentClass: 'border-t-4 border-t-[#78909C]',
  },
  {
    key: 'COMPLETED',
    title: 'Completadas con Acta',
    subtitle: 'Cerradas con firma y evidencias',
    statuses: ['COMPLETADA'],
    accentClass: 'border-t-4 border-t-[#0D6950]',
  },
];

export function FieldMonitoringPage() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTechnicianId, setSelectedTechnicianId] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [inspectedVisitId, setInspectedVisitId] = useState<string | null>(
    searchParams.get('visitId')
  );

  // Estado del formulario de resolución del supervisor (CA-06)
  const [supervisorNotes, setSupervisorNotes] = useState('');
  const [closeAsCompleted, setCloseAsCompleted] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['monitoring', 'live'],
    queryFn: monitoringService.getLiveMonitoringData,
  });

  const visits = data?.visits ?? [];
  const technicians = data?.technicians ?? [];

  const inspectedVisit: EnrichedVisit | null = useMemo(() => {
    if (!inspectedVisitId) return null;
    return visits.find((v) => v.id === inspectedVisitId) ?? null;
  }, [visits, inspectedVisitId]);

  useEffect(() => {
    const paramVisitId = searchParams.get('visitId');
    if (paramVisitId) {
      setInspectedVisitId(paramVisitId);
    }
  }, [searchParams]);

  useEffect(() => {
    if (inspectedVisit) {
      setSupervisorNotes(inspectedVisit.execution?.supervisorNotes ?? '');
      setCloseAsCompleted(false);
    }
  }, [inspectedVisit]);

  const resolveMutation = useMutation({
    mutationFn: monitoringService.resolvePendingVisit,
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['monitoring'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      setFeedbackBanner(
        `Seguimiento de supervisor guardado para la orden ${updated.code}.`
      );
    },
  });

  const filteredVisits = useMemo(() => {
    return visits.filter((visit) => {
      const q = searchTerm.trim().toLowerCase();
      const matchesQuery =
        !q ||
        visit.code.toLowerCase().includes(q) ||
        visit.clientName.toLowerCase().includes(q) ||
        visit.branchName.toLowerCase().includes(q) ||
        visit.title.toLowerCase().includes(q);
      const matchesTech =
        selectedTechnicianId === 'ALL' ||
        visit.technicianId === selectedTechnicianId;
      const matchesStatus =
        selectedStatusFilter === 'ALL' || visit.status === selectedStatusFilter;
      return matchesQuery && matchesTech && matchesStatus;
    });
  }, [visits, searchTerm, selectedTechnicianId, selectedStatusFilter]);

  const activeFieldCount = visits.filter((v) =>
    ['EN_TRASLADO', 'EN_CURSO', 'PAUSADA'].includes(v.status)
  ).length;
  const pendingIssuesCount = visits.filter(
    (v) => v.status === 'CON_PENDIENTES'
  ).length;
  const completedCount = visits.filter((v) => v.status === 'COMPLETADA').length;

  const handleOpenInspect = (visitId: string) => {
    setInspectedVisitId(visitId);
    setSearchParams({ visitId });
  };

  const handleCloseInspect = (open: boolean) => {
    if (!open) {
      setInspectedVisitId(null);
      searchParams.delete('visitId');
      setSearchParams(searchParams);
    }
  };

  const handleSaveSupervisorResolution = () => {
    if (!inspectedVisit || !supervisorNotes.trim()) return;
    resolveMutation.mutate({
      visitId: inspectedVisit.id,
      supervisorNotes,
      closeAsCompleted,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoreo y Auditoría en Campo (M07)"
        description="Seguimiento en vivo de técnicos, control de tiempos efectivos, inspección de evidencias fotográficas, firmas y resolución de pendientes."
      />

      {feedbackBanner && (
        <div className="flex items-center justify-between rounded-md border border-[#0D6950]/30 bg-[#E6F2EF] px-4 py-3 text-sm text-[#0D6950]">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{feedbackBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-xs font-semibold underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Resumen Operativo Superior */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-[#E0E6E4] bg-white shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#78909C]">
                Unidades Activas en Campo
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#0D6950]">
                {activeFieldCount}
              </p>
              <p className="mt-0.5 text-xs text-[#78909C]">
                En traslado, ejecución o pausa registrada
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#E6F2EF] text-[#0D6950]">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#A8262B]/40 bg-white shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#A8262B]">
                Visitas Con Pendientes (CA-06)
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#A8262B]">
                {pendingIssuesCount}
              </p>
              <p className="mt-0.5 text-xs text-[#78909C]">
                Requieren revisión de supervisor o repuesto
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F9E8E9] text-[#A8262B]">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E0E6E4] bg-white shadow-sm">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#78909C]">
                Visitas Completadas con Acta
              </p>
              <p className="mt-1 font-mono text-2xl font-bold text-[#1F2926]">
                {completedCount}
              </p>
              <p className="mt-0.5 text-xs text-[#78909C]">
                Checklist validado + firma digital en sede
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#E6F2EF] text-[#0D6950]">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de filtros */}
      <Card className="border-[#E0E6E4] bg-white shadow-sm">
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#78909C]" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código (VIS-2026...), cliente, sede o servicio..."
              className="pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedTechnicianId}
              onChange={(e) => setSelectedTechnicianId(e.target.value)}
              className="h-9 rounded-md border border-[#E0E6E4] bg-white px-3 text-xs font-medium text-[#1F2926] focus:border-[#0D6950] focus:outline-none"
            >
              <option value="ALL">Todos los técnicos</option>
              {technicians.map((tech) => (
                <option key={tech.id} value={tech.id}>
                  {tech.fullName}
                </option>
              ))}
            </select>

            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="h-9 rounded-md border border-[#E0E6E4] bg-white px-3 text-xs font-medium text-[#1F2926] focus:border-[#0D6950] focus:outline-none"
            >
              <option value="ALL">Todos los estados</option>
              <option value="EN_TRASLADO">En Traslado</option>
              <option value="EN_CURSO">En Curso</option>
              <option value="PAUSADA">Pausada</option>
              <option value="CON_PENDIENTES">Con Pendientes</option>
              <option value="COMPLETADA">Completada</option>
              <option value="PROGRAMADA">Programada</option>
              <option value="VENCIDA">Vencida</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tablero de Monitoreo en Vivo por Columnas */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-80 animate-pulse rounded-lg border border-[#E0E6E4] bg-white p-4"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
          {BOARD_COLUMNS.map((col) => {
            const colVisits = filteredVisits.filter((v) =>
              col.statuses.includes(v.status)
            );
            return (
              <Card
                key={col.key}
                className={`border-[#E0E6E4] bg-white shadow-sm ${col.accentClass}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold text-[#1F2926]">
                      {col.title}
                    </CardTitle>
                    <span className="rounded-full bg-[#F4F6F6] px-2.5 py-0.5 font-mono text-xs font-bold text-[#1F2926]">
                      {colVisits.length}
                    </span>
                  </div>
                  <CardDescription className="text-xs text-[#78909C]">
                    {col.subtitle}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {colVisits.length === 0 ? (
                    <div className="rounded-md border border-dashed border-[#E0E6E4] p-6 text-center text-xs text-[#78909C]">
                      Sin órdenes en esta columna.
                    </div>
                  ) : (
                    colVisits.map((visit) => {
                      const exec = visit.execution;
                      const checklistTotal = exec?.checklistResults.length ?? 0;
                      const checklistDone =
                        exec?.checklistResults.filter((c) => c.completed)
                          .length ?? 0;

                      return (
                        <div
                          key={visit.id}
                          className="rounded-md border border-[#E0E6E4] bg-[#F4F6F6]/50 p-3 transition-colors hover:border-[#0D6950]/50 hover:bg-white"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-[#1F2926]">
                              {visit.code}
                            </span>
                            <VisitStatusBadge status={visit.status} />
                          </div>

                          <p className="mt-1.5 text-xs font-bold text-[#1F2926]">
                            {visit.clientName}
                          </p>
                          <p className="text-[11px] text-[#78909C]">
                            {visit.branchName} • {visit.branchZone}
                          </p>
                          <p className="mt-1 text-xs font-medium text-[#0D6950]">
                            {visit.title}
                          </p>

                          <div className="mt-2 space-y-1 border-t border-[#E0E6E4] pt-2 text-[11px] text-[#78909C]">
                            <div className="flex items-center justify-between">
                              <span>Técnico:</span>
                              <span className="font-semibold text-[#1F2926]">
                                {visit.technicianName ?? 'Sin asignar'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Fecha / Hora:</span>
                              <span className="font-mono text-[#1F2926]">
                                {visit.scheduledDate}{' '}
                                {visit.scheduledStartTime ?? ''}
                              </span>
                            </div>
                            {exec && (
                              <div className="flex items-center justify-between">
                                <span>Tiempo Efectivo:</span>
                                <span className="font-mono font-semibold text-[#0D6950]">
                                  {formatSecondsToDuration(
                                    exec.effectiveWorkSeconds
                                  )}{' '}
                                  / {visit.estimatedDurationMinutes}m
                                </span>
                              </div>
                            )}
                            {checklistTotal > 0 && (
                              <div className="flex items-center justify-between">
                                <span>Checklist:</span>
                                <span className="font-mono font-semibold text-[#1F2926]">
                                  {checklistDone}/{checklistTotal} ítems
                                </span>
                              </div>
                            )}
                          </div>

                          {visit.status === 'CON_PENDIENTES' &&
                            exec?.pendingIssuesDescription && (
                              <div className="mt-2 rounded border border-[#A8262B]/30 bg-[#F9E8E9] p-2 text-[11px] text-[#A8262B]">
                                <p className="font-semibold">
                                  Pendiente reportado:
                                </p>
                                <p className="line-clamp-2">
                                  {exec.pendingIssuesDescription}
                                </p>
                              </div>
                            )}

                          {exec?.supervisorReviewed && (
                            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#0D6950]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Auditado por Supervisor</span>
                            </div>
                          )}

                          <div className="mt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenInspect(visit.id)}
                              className="h-8 w-full border-[#0D6950]/40 text-xs font-semibold text-[#0D6950] hover:bg-[#E6F2EF]"
                            >
                              <Eye className="mr-1.5 h-3.5 w-3.5" />
                              Inspeccionar Ejecución
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal / Drawer de Inspección Detallada de Ejecución (CA-06) */}
      <Dialog open={Boolean(inspectedVisit)} onOpenChange={handleCloseInspect}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto border-[#E0E6E4] bg-white">
          {inspectedVisit && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#F4F6F6] px-2.5 py-1 font-mono text-xs font-bold text-[#1F2926]">
                      {inspectedVisit.code}
                    </span>
                    <VisitStatusBadge status={inspectedVisit.status} />
                  </div>
                  <span className="font-mono text-xs text-[#78909C]">
                    Fecha programada: {inspectedVisit.scheduledDate}{' '}
                    {inspectedVisit.scheduledStartTime ?? ''}
                  </span>
                </div>
                <DialogTitle className="mt-2 text-lg font-bold text-[#1F2926]">
                  {inspectedVisit.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-[#78909C]">
                  {inspectedVisit.clientName} (RUC:{' '}
                  <span className="font-mono">{inspectedVisit.clientRuc}</span>)
                  — {inspectedVisit.branchName} ({inspectedVisit.branchAddress})
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* 1. Trazabilidad de Tiempos y GPS */}
                <div className="rounded-lg border border-[#E0E6E4] bg-[#F4F6F6]/60 p-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F2926]">
                    <Clock className="h-4 w-4 text-[#0D6950]" />
                    Cronometría Operativa y Geolocalización (JetBrains Mono)
                  </h4>

                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded border border-[#E0E6E4] bg-white p-2.5">
                      <p className="text-[11px] text-[#78909C]">
                        Inicio Traslado
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-[#1F2926]">
                        {formatIsoTime(
                          inspectedVisit.execution?.transitStartedAt
                        )}
                      </p>
                    </div>
                    <div className="rounded border border-[#E0E6E4] bg-white p-2.5">
                      <p className="text-[11px] text-[#78909C]">
                        Llegada a Sede
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-[#1F2926]">
                        {formatIsoTime(inspectedVisit.execution?.arrivedAt)}
                      </p>
                    </div>
                    <div className="rounded border border-[#E0E6E4] bg-white p-2.5">
                      <p className="text-[11px] text-[#78909C]">
                        Inicio Atención
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-[#0D6950]">
                        {formatIsoTime(inspectedVisit.execution?.workStartedAt)}
                      </p>
                    </div>
                    <div className="rounded border border-[#E0E6E4] bg-white p-2.5">
                      <p className="text-[11px] text-[#78909C]">
                        Cierre Técnico
                      </p>
                      <p className="mt-0.5 font-mono text-sm font-bold text-[#1F2926]">
                        {formatIsoTime(inspectedVisit.execution?.workEndedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="flex items-center gap-2 rounded border border-[#E0E6E4] bg-white p-2.5">
                      <Truck className="h-4 w-4 text-[#78909C]" />
                      <div>
                        <p className="text-[11px] text-[#78909C]">
                          Tiempo de Traslado
                        </p>
                        <p className="font-mono text-xs font-bold text-[#1F2926]">
                          {formatSecondsToDuration(
                            inspectedVisit.execution?.transitSeconds ?? 0
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded border border-[#E0E6E4] bg-white p-2.5">
                      <Wrench className="h-4 w-4 text-[#0D6950]" />
                      <div>
                        <p className="text-[11px] text-[#78909C]">
                          Efectivo vs. Estimado
                        </p>
                        <p className="font-mono text-xs font-bold text-[#0D6950]">
                          {formatSecondsToDuration(
                            inspectedVisit.execution?.effectiveWorkSeconds ?? 0
                          )}{' '}
                          / {inspectedVisit.estimatedDurationMinutes}m
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 rounded border border-[#E0E6E4] bg-white p-2.5">
                      <MapPin className="h-4 w-4 text-[#0D6950]" />
                      <div>
                        <p className="text-[11px] text-[#78909C]">
                          Check-In GPS en Sede
                        </p>
                        {inspectedVisit.execution?.checkInCoordinates ? (
                          <p className="font-mono text-[11px] font-semibold text-[#1F2926]">
                            {inspectedVisit.execution.checkInCoordinates.lat.toFixed(
                              4
                            )}
                            ,{' '}
                            {inspectedVisit.execution.checkInCoordinates.lng.toFixed(
                              4
                            )}{' '}
                            (±
                            {
                              inspectedVisit.execution.checkInCoordinates
                                .accuracy
                            }
                            m)
                          </p>
                        ) : inspectedVisit.execution?.gpsFallbackReason ? (
                          <p className="text-[11px] font-medium text-[#A8262B]">
                            Contingencia:{' '}
                            {inspectedVisit.execution.gpsFallbackReason}
                          </p>
                        ) : (
                          <p className="text-[11px] text-[#78909C]">
                            Sin registro GPS aún
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Historial de Pausas */}
                  {inspectedVisit.execution?.pauses &&
                    inspectedVisit.execution.pauses.length > 0 && (
                      <div className="mt-3 rounded border border-[#E0E6E4] bg-white p-2.5">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-[#1F2926]">
                          <PauseCircle className="h-3.5 w-3.5 text-[#78909C]" />
                          Pausas Registradas (
                          {inspectedVisit.execution.pauses.length})
                        </p>
                        <ul className="mt-1 space-y-1 text-xs text-[#78909C]">
                          {inspectedVisit.execution.pauses.map((p, idx) => (
                            <li key={idx} className="font-mono text-[11px]">
                              • {formatIsoTime(p.startedAt)} →{' '}
                              {formatIsoTime(p.endedAt)}:{' '}
                              <span className="font-sans text-[#1F2926]">
                                {p.reason ?? 'Pausa operativa'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>

                {/* 2. Checklist de Tareas */}
                <div className="rounded-lg border border-[#E0E6E4] bg-white p-4">
                  <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F2926]">
                    <ClipboardCheck className="h-4 w-4 text-[#0D6950]" />
                    Protocolo y Checklist Técnico
                  </h4>
                  {!inspectedVisit.execution ||
                  inspectedVisit.execution.checklistResults.length === 0 ? (
                    <p className="mt-2 text-xs text-[#78909C]">
                      El técnico aún no ha registrado avances del checklist.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {inspectedVisit.execution.checklistResults.map((item) => (
                        <div
                          key={item.itemId}
                          className="flex items-start justify-between gap-3 rounded border border-[#E0E6E4] bg-[#F4F6F6]/40 px-3 py-2 text-xs"
                        >
                          <div className="flex items-start gap-2">
                            <span
                              className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                                item.completed
                                  ? 'bg-[#0D6950] text-white'
                                  : 'border border-[#78909C] text-[#78909C]'
                              }`}
                            >
                              {item.completed ? '✓' : ''}
                            </span>
                            <div>
                              <p className="font-medium text-[#1F2926]">
                                {item.label}
                              </p>
                              {item.note && (
                                <p className="mt-0.5 text-[11px] text-[#78909C]">
                                  Nota: {item.note}
                                </p>
                              )}
                            </div>
                          </div>
                          {item.isRequired && (
                            <span className="shrink-0 rounded bg-[#E6F2EF] px-2 py-0.5 text-[10px] font-semibold text-[#0D6950]">
                              Obligatorio
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Informe Técnico y Diagnóstico */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#E0E6E4] bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#78909C]">
                      Diagnóstico en Sitio
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[#1F2926]">
                      {inspectedVisit.execution?.diagnostics ||
                        'Sin diagnóstico registrado.'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E0E6E4] bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-[#78909C]">
                      Trabajos y Solución Aplicada
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-[#1F2926]">
                      {inspectedVisit.execution?.solutionApplied ||
                        'Sin solución registrada.'}
                    </p>
                    {inspectedVisit.execution?.sparePartsUsed && (
                      <p className="mt-2 rounded bg-[#F4F6F6] p-2 font-mono text-[11px] text-[#1F2926]">
                        Repuestos: {inspectedVisit.execution.sparePartsUsed}
                      </p>
                    )}
                  </div>
                </div>

                {/* 4. Evidencias Fotográficas y Firma de Conformidad */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-[#E0E6E4] bg-white p-4">
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F2926]">
                      <Camera className="h-4 w-4 text-[#0D6950]" />
                      Evidencias Fotográficas (
                      {inspectedVisit.execution?.evidences.length ?? 0})
                    </h4>
                    {!inspectedVisit.execution ||
                    inspectedVisit.execution.evidences.length === 0 ? (
                      <p className="mt-2 text-xs text-[#78909C]">
                        Sin fotografías adjuntas.
                      </p>
                    ) : (
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        {inspectedVisit.execution.evidences.map((ev) => (
                          <div
                            key={ev.id}
                            className="overflow-hidden rounded border border-[#E0E6E4]"
                          >
                            <img
                              src={ev.url}
                              alt={ev.caption ?? 'Evidencia de campo'}
                              className="h-32 w-full bg-[#1F2926] object-cover"
                            />
                            <div className="bg-[#F4F6F6] px-2.5 py-1.5 text-[11px] text-[#1F2926]">
                              <p className="font-medium">
                                {ev.caption ?? 'Fotografía técnica'}
                              </p>
                              <p className="font-mono text-[10px] text-[#78909C]">
                                {formatIsoTime(ev.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg border border-[#E0E6E4] bg-white p-4">
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F2926]">
                      <FileSignature className="h-4 w-4 text-[#0D6950]" />
                      Acta y Conformidad en Sede
                    </h4>
                    {inspectedVisit.execution?.signOff ? (
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="rounded border border-[#E0E6E4] bg-[#F4F6F6]/60 p-2.5">
                          <p className="font-bold text-[#1F2926]">
                            <UserCheck className="mr-1 inline h-3.5 w-3.5 text-[#0D6950]" />
                            {inspectedVisit.execution.signOff.receiverName}
                          </p>
                          <p className="text-[11px] text-[#78909C]">
                            Cargo:{' '}
                            {inspectedVisit.execution.signOff.receiverRole ??
                              'Responsable de sede'}{' '}
                            • Doc:{' '}
                            <span className="font-mono">
                              {inspectedVisit.execution.signOff
                                .receiverDocument ?? '—'}
                            </span>
                          </p>
                        </div>
                        <div className="rounded border border-[#E0E6E4] bg-white p-2 text-center">
                          <img
                            src={
                              inspectedVisit.execution.signOff.signatureDataUrl
                            }
                            alt="Firma de conformidad"
                            className="mx-auto h-20 object-contain"
                          />
                          <p className="mt-1 font-mono text-[10px] text-[#78909C]">
                            Firmado: {inspectedVisit.execution.signOff.signedAt}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-[#78909C]">
                        Pendiente de firma digital del cliente en sede.
                      </p>
                    )}
                  </div>
                </div>

                {/* 5. SupervisorIncidentResolutionBox (CA-06) */}
                {(inspectedVisit.status === 'CON_PENDIENTES' ||
                  inspectedVisit.execution?.hasPendingIssues ||
                  inspectedVisit.execution?.supervisorReviewed) && (
                  <div className="rounded-lg border-2 border-[#A8262B]/40 bg-[#F9E8E9]/40 p-4">
                    <div className="flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A8262B]">
                        <AlertTriangle className="h-4 w-4" />
                        Gestión de Pendientes y Auditoría de Supervisor (CA-06)
                      </h4>
                      {inspectedVisit.execution?.supervisorReviewed && (
                        <span className="rounded bg-[#0D6950] px-2 py-0.5 text-[10px] font-bold text-white">
                          Revisado por Supervisor
                        </span>
                      )}
                    </div>

                    {inspectedVisit.execution?.pendingIssuesDescription && (
                      <div className="mt-2 rounded border border-[#A8262B]/20 bg-white p-2.5 text-xs text-[#1F2926]">
                        <span className="font-bold text-[#A8262B]">
                          Observación crítica del técnico en campo:{' '}
                        </span>
                        {inspectedVisit.execution.pendingIssuesDescription}
                      </div>
                    )}

                    <div className="mt-3 space-y-2">
                      <Label className="text-xs font-semibold text-[#1F2926]">
                        Acción Correctiva / Disposición de Supervisión
                      </Label>
                      <textarea
                        rows={3}
                        value={supervisorNotes}
                        onChange={(e) => setSupervisorNotes(e.target.value)}
                        placeholder="Ej. Se generó requerimiento de repuesto urgente y se agenda visita correctiva sin costo adicional..."
                        className="w-full rounded-md border border-[#E0E6E4] bg-white p-2.5 text-xs text-[#1F2926] focus:border-[#0D6950] focus:outline-none"
                      />
                    </div>

                    {inspectedVisit.status === 'CON_PENDIENTES' && (
                      <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs font-medium text-[#1F2926]">
                        <input
                          type="checkbox"
                          checked={closeAsCompleted}
                          onChange={(e) =>
                            setCloseAsCompleted(e.target.checked)
                          }
                          className="h-4 w-4 rounded border-[#E0E6E4] accent-[#0D6950]"
                        />
                        Dar por subsanado el pendiente y cambiar estado de la
                        visita a COMPLETADA
                      </label>
                    )}

                    <div className="mt-3 flex justify-end">
                      <Button
                        size="sm"
                        disabled={
                          !supervisorNotes.trim() || resolveMutation.isPending
                        }
                        onClick={handleSaveSupervisorResolution}
                        className="bg-[#0D6950] text-xs font-semibold text-white hover:bg-[#0B533E]"
                      >
                        <Navigation className="mr-1.5 h-3.5 w-3.5" />
                        {resolveMutation.isPending
                          ? 'Guardando...'
                          : 'Guardar Disposición de Supervisión'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => handleCloseInspect(false)}
                >
                  Cerrar Inspección
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
