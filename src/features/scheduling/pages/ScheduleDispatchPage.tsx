import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  History,
  MapPin,
  Sparkles,
  UserCheck,
  Wrench,
} from 'lucide-react';
import {
  addMinutesToTime,
  detectScheduleConflict,
  schedulingService,
  type GenerateRecurrenceResult,
} from '@/features/scheduling/api/scheduling.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { addDaysToIsoDate, getTodayIsoDate } from '@/lib/field-mock-db';
import type { EnrichedVisit } from '@/types/field.types';
import { PageHeader } from '@/components/common/PageHeader';
import { VisitStatusBadge } from '@/components/common/VisitStatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const RESCHEDULE_REASONS = [
  'Solicitud expresa del cliente en sede',
  'Cruce operativo por emergencia en otra planta',
  'Espera de repuesto o componente electrónico',
  'Restricción de acceso o seguridad en instalaciones',
];

export function ScheduleDispatchPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const today = getTodayIsoDate();
  const [periodStart, setPeriodStart] = useState(today);
  const [periodEnd, setPeriodEnd] = useState(addDaysToIsoDate(today, 30));
  const [selectedFilterDate, setSelectedFilterDate] = useState<string>('ALL');
  const [recurrenceBanner, setRecurrenceBanner] =
    useState<GenerateRecurrenceResult | null>(null);

  // Estado del Cajón de Asignación Asistida (AssistedAssignmentDrawer)
  const [assigningVisit, setAssigningVisit] = useState<EnrichedVisit | null>(
    null
  );
  const [assignDate, setAssignDate] = useState(today);
  const [assignStartTime, setAssignStartTime] = useState('09:00');
  const [selectedTechId, setSelectedTechId] = useState<string>('');

  // Estado del Modal de Reprogramación con Motivo Obligatorio (RescheduleWithReasonModal)
  const [reschedulingVisit, setReschedulingVisit] =
    useState<EnrichedVisit | null>(null);
  const [reschedDate, setReschedDate] = useState(today);
  const [reschedTime, setReschedTime] = useState('10:00');
  const [reschedTechId, setReschedTechId] = useState<string>('');
  const [reschedPresetReason, setReschedPresetReason] = useState(
    RESCHEDULE_REASONS[0] ?? ''
  );
  const [reschedCustomReason, setReschedCustomReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['scheduling-data'],
    queryFn: schedulingService.getSchedulingData,
  });

  const visits = data?.data.visits ?? [];
  const technicians = data?.data.technicians ?? [];

  // Si venimos desde Dashboard con ?visitId=..., abrir automáticamente su modal
  useEffect(() => {
    const visitIdFromQuery = searchParams.get('visitId');
    if (!visitIdFromQuery || visits.length === 0) return;

    const targetVisit = visits.find((v) => v.id === visitIdFromQuery);
    if (targetVisit) {
      if (targetVisit.status === 'POR_PROGRAMAR') {
        handleOpenAssign(targetVisit);
      } else {
        handleOpenReschedule(targetVisit);
      }
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, visits]);

  const generateMutation = useMutation({
    mutationFn: () =>
      schedulingService.generateRecurringVisits({
        startDate: periodStart,
        endDate: periodEnd,
      }),
    onSuccess: (response) => {
      setRecurrenceBanner(response.data);
      queryClient.invalidateQueries({ queryKey: ['scheduling-data'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-daily-overview'] });
    },
  });

  const assignMutation = useMutation({
    mutationFn: schedulingService.assignVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-data'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-daily-overview'] });
      setAssigningVisit(null);
    },
  });

  const rescheduleMutation = useMutation({
    mutationFn: schedulingService.rescheduleVisit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduling-data'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-daily-overview'] });
      setReschedulingVisit(null);
      setReschedCustomReason('');
    },
  });

  const handleOpenAssign = (visit: EnrichedVisit) => {
    setAssigningVisit(visit);
    setAssignDate(visit.scheduledDate || today);
    setAssignStartTime(visit.scheduledStartTime || '09:00');
    const firstTech = technicians[0];
    setSelectedTechId(visit.technicianId ?? firstTech?.id ?? '');
  };

  const handleOpenReschedule = (visit: EnrichedVisit) => {
    setReschedulingVisit(visit);
    setReschedDate(visit.scheduledDate || today);
    setReschedTime(visit.scheduledStartTime || '10:00');
    setReschedTechId(visit.technicianId ?? technicians[0]?.id ?? '');
    setReschedPresetReason(RESCHEDULE_REASONS[0] ?? '');
    setReschedCustomReason('');
  };

  const unassignedVisits = visits.filter(
    (v) => v.status === 'POR_PROGRAMAR' || v.status === 'VENCIDA'
  );

  const scheduledVisits = visits.filter((v) => {
    if (v.status === 'POR_PROGRAMAR') return false;
    if (selectedFilterDate !== 'ALL' && v.scheduledDate !== selectedFilterDate) {
      return false;
    }
    return true;
  });

  const uniqueDates = Array.from(
    new Set(visits.map((v) => v.scheduledDate))
  ).sort();

  // Cálculo de sugerencias ordenadas para AssistedAssignmentDrawer
  const scoredTechnicians = assigningVisit
    ? technicians
        .map((tech) => {
          const matchesSpecialty = tech.specialties.includes(
            assigningVisit.requiredSpecialty
          );
          const matchesZone = tech.assignedZones.includes(
            assigningVisit.branchZone
          );
          const conflictCheck = detectScheduleConflict({
            technician: tech,
            allVisits: visits,
            excludeVisitId: assigningVisit.id,
            scheduledDate: assignDate,
            startTime: assignStartTime,
            durationMinutes: assigningVisit.estimatedDurationMinutes,
          });

          const score =
            (matchesSpecialty ? 50 : 0) +
            (matchesZone ? 35 : 0) +
            (!conflictCheck.hasOverlap && !conflictCheck.isOutsideWorkHours
              ? 15
              : -40);

          return {
            tech,
            matchesSpecialty,
            matchesZone,
            conflictCheck,
            score,
          };
        })
        .sort((a, b) => b.score - a.score)
    : [];

  const activeSelectionConflict = scoredTechnicians.find(
    (item) => item.tech.id === selectedTechId
  )?.conflictCheck;

  const finalRescheduleReason = reschedCustomReason.trim()
    ? `${reschedPresetReason} — ${reschedCustomReason.trim()}`
    : reschedPresetReason;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda de Visitas y Asignación Asistida"
        description="Generación recurrente idempotente (CA-02), sugerencia inteligente de técnicos, alerta de cruces horarios y reprogramación auditada (CA-03)."
      />

      {/* RecurrenceGeneratorToolbar (CA-02) */}
      <Card className="border-[#0D6950]/30 bg-card">
        <CardContent className="flex flex-col justify-between gap-4 p-4 lg:flex-row lg:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-[#0D6950]" />
              <span>Generador de Visitas por Recurrencia (CA-02)</span>
            </div>
            <p className="text-[12px] text-[#78909C]">
              Proyecta las visitas de los planes preventivos activos para el
              periodo seleccionado. Es <strong>idempotente</strong>: ejecutarlo
              múltiples veces omite visitas ya creadas.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-[#78909C]">Desde</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="h-9 w-[155px] font-mono text-[12px]"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-[#78909C]">Hasta</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="h-9 w-[155px] font-mono text-[12px]"
              />
            </div>
            <Button
              size="sm"
              disabled={generateMutation.isPending}
              onClick={() => generateMutation.mutate()}
            >
              <CalendarClock className="h-4 w-4" />
              <span>
                {generateMutation.isPending
                  ? 'Generando periodo (400ms)...'
                  : 'Generar Visitas del Periodo'}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Banner de retroalimentación de Idempotencia (CA-02) */}
      {recurrenceBanner && (
        <div className="flex items-center justify-between rounded-[8px] border border-[#0D6950] bg-[#0D6950]/10 px-4 py-3 text-[12px] text-[#0D6950]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              <strong>Ejecución Idempotente Completada (CA-02):</strong> Se
              evaluaron {recurrenceBanner.evaluatedPlansCount} planes activos →{' '}
              <strong>{recurrenceBanner.createdCount} visitas nuevas creadas</strong>{' '}
              y{' '}
              <strong>
                {recurrenceBanner.skippedDuplicatesCount} duplicados omitidos
              </strong>{' '}
              (0 duplicados generados).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setRecurrenceBanner(null)}
            className="text-[11px] font-semibold underline"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* Layout Principal: UnassignedVisitsSidebar + InteractiveScheduleCalendar */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Columna Lateral: Por Programar y Vencidas */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-[18px]">
                Bandeja por Asignar
              </CardTitle>
              <Badge variant="warning">{unassignedVisits.length}</Badge>
            </div>
            <CardDescription>
              Visitas en estado <strong>Por programar</strong> o{' '}
              <strong>Vencidas</strong> pendientes de despacho.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 max-h-[580px] overflow-y-auto">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-28 w-full rounded-[8px]" />
              ))
            ) : unassignedVisits.length === 0 ? (
              <EmptyState
                title="Bandeja al día"
                description="Todas las visitas generadas ya tienen técnico y horario asignado."
              />
            ) : (
              unassignedVisits.map((visit) => (
                <div
                  key={visit.id}
                  className={cn(
                    'space-y-2.5 rounded-[12px] border p-3.5 transition-colors',
                    visit.status === 'VENCIDA'
                      ? 'border-[#A8262B] bg-[#A8262B]/[0.04]'
                      : 'bg-background hover:border-[#0D6950]/50'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-[#0D6950]">
                      {visit.code} • {visit.scheduledDate}
                    </span>
                    <VisitStatusBadge status={visit.status} />
                  </div>

                  <div>
                    <p className="text-[13px] font-semibold text-foreground">
                      {visit.clientName}
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-[#78909C]">
                      <MapPin className="h-3 w-3 text-[#0D6950]" />
                      {visit.branchName} ({visit.branchZone})
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t pt-2 text-[11px]">
                    <Badge variant="info">{visit.requiredSpecialty}</Badge>
                    <span className="font-mono text-[#78909C]">
                      {visit.estimatedDurationMinutes} min
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant={visit.status === 'VENCIDA' ? 'cta' : 'default'}
                    className="w-full"
                    onClick={() =>
                      visit.status === 'VENCIDA'
                        ? handleOpenReschedule(visit)
                        : handleOpenAssign(visit)
                    }
                  >
                    <UserCheck className="h-3.5 w-3.5" />
                    <span>
                      {visit.status === 'VENCIDA'
                        ? 'Reprogramar con Motivo'
                        : 'Asignación Asistida'}
                    </span>
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Calendario / Línea de Tiempo de Visitas Programadas */}
        <Card className="col-span-1 lg:col-span-5">
          <CardHeader className="space-y-3 pb-3">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <CardTitle className="text-[18px]">
                  Calendario de Despacho y Auditoría de Reprogramaciones
                </CardTitle>
                <CardDescription>
                  Haz clic en cualquier visita programada para cambiar técnico o
                  reprogramar con motivo auditado.
                </CardDescription>
              </div>

              <Select
                value={selectedFilterDate}
                onValueChange={setSelectedFilterDate}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrar por fecha" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todas las fechas</SelectItem>
                  {uniqueDates.map((d) => (
                    <SelectItem key={d} value={d}>
                      Fecha: {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-24 w-full rounded-[8px]" />
              ))
            ) : scheduledVisits.length === 0 ? (
              <EmptyState
                title="No hay visitas programadas en esta fecha"
                description="Selecciona otra fecha o asigna visitas desde la bandeja lateral."
              />
            ) : (
              scheduledVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="flex flex-col justify-between gap-3 rounded-[12px] border bg-card p-4 transition-colors hover:border-[#0D6950]/40 sm:flex-row sm:items-center"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-[6px] bg-[#0D6950]/10 px-2 py-0.5 font-mono text-[12px] font-bold text-[#0D6950]">
                        {visit.scheduledDate} •{' '}
                        {visit.scheduledStartTime ?? '--:--'} a{' '}
                        {visit.scheduledEndTime ?? '--:--'}
                      </span>
                      <span className="font-mono text-[11px] text-[#78909C]">
                        {visit.code}
                      </span>
                      <VisitStatusBadge status={visit.status} />
                    </div>

                    <p className="text-[14px] font-semibold text-foreground">
                      {visit.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[12px] text-[#78909C]">
                      <span className="font-medium text-foreground">
                        {visit.clientName}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#0D6950]" />
                        {visit.branchName} ({visit.branchZone})
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <Wrench className="h-3.5 w-3.5 text-[#0D6950]" />
                        Técnico:{' '}
                        <strong className="text-foreground">
                          {visit.technicianName ?? 'Sin asignar'}
                        </strong>
                      </span>
                    </div>

                    {/* Historial de Auditoría de Reprogramación (CA-03) */}
                    {visit.rescheduleHistory.length > 0 && (
                      <div className="mt-2 rounded-[6px] border border-[#E29528]/40 bg-[#E29528]/10 px-3 py-1.5 text-[11px] text-[#B87314] dark:text-[#F2AE49]">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <History className="h-3.5 w-3.5" />
                          <span>
                            Reprogramada ({visit.rescheduleHistory.length}): De{' '}
                            {visit.rescheduleHistory[0]?.previousDate}{' '}
                            {visit.rescheduleHistory[0]?.previousStartTime ?? ''}{' '}
                            → {visit.rescheduleHistory[0]?.newDate}{' '}
                            {visit.rescheduleHistory[0]?.newStartTime ?? ''}
                          </span>
                        </div>
                        <p className="mt-0.5">
                          Motivo:{' '}
                          <strong>
                            {visit.rescheduleHistory[0]?.reason}
                          </strong>{' '}
                          (Por: {visit.rescheduleHistory[0]?.changedBy})
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenAssign(visit)}
                    >
                      Reasignar Técnico
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenReschedule(visit)}
                    >
                      <History className="h-3.5 w-3.5" />
                      <span>Reprogramar</span>
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal 1: AssistedAssignmentDrawer + ConflictWarningBanner (CA-03) */}
      <Dialog
        open={Boolean(assigningVisit)}
        onOpenChange={(open) => {
          if (!open) setAssigningVisit(null);
        }}
      >
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>
              Asignación Asistida de Técnico ({assigningVisit?.code})
            </DialogTitle>
            <DialogDescription>
              {assigningVisit?.clientName} — {assigningVisit?.branchName} (Zona:{' '}
              <strong>{assigningVisit?.branchZone}</strong> • Especialidad:{' '}
              <strong>{assigningVisit?.requiredSpecialty}</strong>)
            </DialogDescription>
          </DialogHeader>

          {assigningVisit && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="assign-date">Fecha Programada</Label>
                  <Input
                    id="assign-date"
                    type="date"
                    className="font-mono"
                    value={assignDate}
                    onChange={(e) => setAssignDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="assign-time">
                    Hora de Inicio (Fin estimado:{' '}
                    {addMinutesToTime(
                      assignStartTime,
                      assigningVisit.estimatedDurationMinutes
                    )}
                    )
                  </Label>
                  <Input
                    id="assign-time"
                    type="time"
                    className="font-mono"
                    value={assignStartTime}
                    onChange={(e) => setAssignStartTime(e.target.value)}
                  />
                </div>
              </div>

              {/* ConflictWarningBanner en #A8262B si hay solapamiento o fuera de jornada (CA-03) */}
              {activeSelectionConflict &&
                (activeSelectionConflict.hasOverlap ||
                  activeSelectionConflict.isOutsideWorkHours) && (
                  <div className="flex items-start gap-2.5 rounded-[8px] border-[1.5px] border-[#A8262B] bg-[#A8262B]/10 p-3.5 text-[12px] text-[#A8262B]">
                    <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-bold">
                        Alerta de Conflicto Horario Detectado (CA-03)
                      </p>
                      {activeSelectionConflict.hasOverlap && (
                        <p>
                          El técnico seleccionado ya tiene asignada la visita{' '}
                          <strong className="font-mono">
                            {activeSelectionConflict.overlappingVisit?.code}
                          </strong>{' '}
                          ({activeSelectionConflict.overlappingVisit?.clientName}
                          ) de{' '}
                          <strong className="font-mono">
                            {
                              activeSelectionConflict.overlappingVisit
                                ?.scheduledStartTime
                            }{' '}
                            a{' '}
                            {
                              activeSelectionConflict.overlappingVisit
                                ?.scheduledEndTime
                            }
                          </strong>
                          .
                        </p>
                      )}
                      {activeSelectionConflict.isOutsideWorkHours && (
                        <p>
                          El rango horario seleccionado excede la jornada
                          laboral configurada para este técnico.
                        </p>
                      )}
                    </div>
                  </div>
                )}

              <div className="space-y-2">
                <p className="text-[12px] font-semibold text-foreground">
                  Técnicos Sugeridos (Ordenados por Especialidad, Zona y
                  Disponibilidad):
                </p>
                <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                  {scoredTechnicians.map(
                    ({
                      tech,
                      matchesSpecialty,
                      matchesZone,
                      conflictCheck,
                    }) => {
                      const isSelected = selectedTechId === tech.id;
                      const hasConflict =
                        conflictCheck.hasOverlap ||
                        conflictCheck.isOutsideWorkHours;

                      return (
                        <button
                          key={tech.id}
                          type="button"
                          onClick={() => setSelectedTechId(tech.id)}
                          className={cn(
                            'flex w-full items-center justify-between rounded-[8px] border p-3 text-left transition-colors',
                            isSelected
                              ? hasConflict
                                ? 'border-[2px] border-[#A8262B] bg-[#A8262B]/5'
                                : 'border-[2px] border-[#0D6950] bg-[#0D6950]/5'
                              : 'hover:bg-accent/50'
                          )}
                        >
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-[13px] font-semibold text-foreground">
                                {tech.fullName}
                              </span>
                              {matchesSpecialty && (
                                <Badge variant="success">
                                  Especialidad Compatible
                                </Badge>
                              )}
                              {matchesZone && (
                                <Badge variant="info">Zona Compatible</Badge>
                              )}
                              {hasConflict && (
                                <Badge variant="destructive">
                                  Cruce Horario
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-[#78909C]">
                              Zonas: {tech.assignedZones.join(', ')} • Jornada:{' '}
                              <span className="font-mono">
                                {tech.workSchedule.startTime}-
                                {tech.workSchedule.endTime}
                              </span>
                            </p>
                          </div>

                          <div className="text-right font-mono text-[11px]">
                            <Clock className="ml-auto h-4 w-4 text-[#0D6950]" />
                            <span>
                              {hasConflict ? 'Ocupado' : 'Disponible'}
                            </span>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAssigningVisit(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant={
                    activeSelectionConflict?.hasOverlap ? 'cta' : 'default'
                  }
                  disabled={!selectedTechId || assignMutation.isPending}
                  onClick={() =>
                    assignMutation.mutate({
                      visitId: assigningVisit.id,
                      technicianId: selectedTechId,
                      scheduledDate: assignDate,
                      scheduledStartTime: assignStartTime,
                    })
                  }
                >
                  {assignMutation.isPending
                    ? 'Asignando (400ms)...'
                    : activeSelectionConflict?.hasOverlap
                      ? 'Forzar Asignación con Advertencia'
                      : 'Confirmar Asignación'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal 2: RescheduleWithReasonModal (CA-03) */}
      <Dialog
        open={Boolean(reschedulingVisit)}
        onOpenChange={(open) => {
          if (!open) setReschedulingVisit(null);
        }}
      >
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              Reprogramar Visita con Auditoría ({reschedulingVisit?.code})
            </DialogTitle>
            <DialogDescription>
              Todo cambio de fecha u hora exige registrar obligatoriamente el
              motivo en el historial de la visita (CA-03).
            </DialogDescription>
          </DialogHeader>

          {reschedulingVisit && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="resched-date">Nueva Fecha</Label>
                  <Input
                    id="resched-date"
                    type="date"
                    className="font-mono"
                    value={reschedDate}
                    onChange={(e) => setReschedDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="resched-time">Nueva Hora de Inicio</Label>
                  <Input
                    id="resched-time"
                    type="time"
                    className="font-mono"
                    value={reschedTime}
                    onChange={(e) => setReschedTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Técnico Responsable</Label>
                <Select value={reschedTechId} onValueChange={setReschedTechId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar técnico" />
                  </SelectTrigger>
                  <SelectContent>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.fullName} ({tech.specialties.join(', ')})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Motivo Estandarizado de Reprogramación *</Label>
                <Select
                  value={reschedPresetReason}
                  onValueChange={setReschedPresetReason}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESCHEDULE_REASONS.map((reason) => (
                      <SelectItem key={reason} value={reason}>
                        {reason}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="resched-notes">
                  Detalle / Observación de Auditoría
                </Label>
                <Input
                  id="resched-notes"
                  placeholder="Ej. Autorizado por Ing. Montalvo vía correo electrónico..."
                  value={reschedCustomReason}
                  onChange={(e) => setReschedCustomReason(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReschedulingVisit(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  disabled={
                    !finalRescheduleReason.trim() ||
                    rescheduleMutation.isPending
                  }
                  onClick={() =>
                    rescheduleMutation.mutate({
                      visitId: reschedulingVisit.id,
                      newDate: reschedDate,
                      newStartTime: reschedTime,
                      technicianId: reschedTechId || undefined,
                      reason: finalRescheduleReason,
                      changedBy: `${user?.name ?? 'Coordinador'} (${user?.role ?? 'COORDINADOR'})`,
                    })
                  }
                >
                  {rescheduleMutation.isPending
                    ? 'Guardando auditoría (400ms)...'
                    : 'Confirmar Reprogramación'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
