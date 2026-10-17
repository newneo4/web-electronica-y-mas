import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { VisitStatusBadge } from '@/components/common/VisitStatusBadge';
import { Button } from '@/components/ui/button';
import { fieldExecutionService } from '../api/field-execution.service';

export function MyAgendaPage() {
  const user = useAuthStore((state) => state.user);
  const technicianId = user?.technicianId ?? 'tech-01';
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'history' ? 'history' : 'active';

  const { data: myVisits = [], isLoading } = useQuery({
    queryKey: ['field', 'my-visits', technicianId],
    queryFn: () => fieldExecutionService.getMyAssignedVisits(technicianId),
  });

  const activeVisits = useMemo(
    () =>
      myVisits.filter((v) =>
        ['PROGRAMADA', 'EN_TRASLADO', 'EN_CURSO', 'PAUSADA', 'VENCIDA'].includes(
          v.status
        )
      ),
    [myVisits]
  );

  const closedVisits = useMemo(
    () =>
      myVisits.filter((v) =>
        ['COMPLETADA', 'CON_PENDIENTES'].includes(v.status)
      ),
    [myVisits]
  );

  const displayedVisits = activeTab === 'history' ? closedVisits : activeVisits;

  return (
    <div className="space-y-4">
      {/* Cabecera de Identidad Operativa del Técnico (CA-04) */}
      <div className="rounded-lg border border-[#E0E6E4] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1 rounded bg-[#E6F2EF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0D6950]">
              <ShieldCheck className="h-3 w-3" />
              Agenda Aislada por Rol (CA-04)
            </span>
            <h1 className="mt-1.5 text-base font-bold text-[#1F2926]">
              Hola, {user?.name ?? 'Técnico Especialista'}
            </h1>
            <p className="text-xs text-[#78909C]">
              ID Operativo:{' '}
              <span className="font-mono font-semibold text-[#1F2926]">
                {technicianId}
              </span>{' '}
              • {myVisits.length} órdenes asignadas
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase text-[#78909C]">
              En cola hoy
            </p>
            <p className="font-mono text-2xl font-bold text-[#0D6950]">
              {activeVisits.length}
            </p>
          </div>
        </div>

        {/* Selector táctil entre Pendientes y Cierres */}
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-md bg-[#F4F6F6] p-1">
          <button
            type="button"
            onClick={() => setSearchParams({})}
            className={`min-h-[42px] rounded text-xs font-bold transition-colors ${
              activeTab === 'active'
                ? 'bg-[#0D6950] text-white shadow-sm'
                : 'text-[#78909C] hover:text-[#1F2926]'
            }`}
          >
            Pendientes / En Curso ({activeVisits.length})
          </button>
          <button
            type="button"
            onClick={() => setSearchParams({ tab: 'history' })}
            className={`min-h-[42px] rounded text-xs font-bold transition-colors ${
              activeTab === 'history'
                ? 'bg-[#0D6950] text-white shadow-sm'
                : 'text-[#78909C] hover:text-[#1F2926]'
            }`}
          >
            Mis Cierres ({closedVisits.length})
          </button>
        </div>
      </div>

      {/* Lista de tarjetas móviles (Touch Targets >= 48px) */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-44 animate-pulse rounded-lg border border-[#E0E6E4] bg-white p-4"
            />
          ))}
        </div>
      ) : displayedVisits.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#E0E6E4] bg-white p-8 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-[#0D6950]" />
          <p className="mt-2 text-sm font-bold text-[#1F2926]">
            {activeTab === 'active'
              ? 'No tienes órdenes pendientes en este momento'
              : 'Aún no registras órdenes cerradas'}
          </p>
          <p className="mt-1 text-xs text-[#78909C]">
            Todas tus asignaciones se sincronizan automáticamente con la central.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedVisits.map((visit) => {
            const isInProgress = [
              'EN_TRASLADO',
              'EN_CURSO',
              'PAUSADA',
            ].includes(visit.status);
            const isClosed = ['COMPLETADA', 'CON_PENDIENTES'].includes(
              visit.status
            );

            return (
              <div
                key={visit.id}
                className={`rounded-lg border bg-white p-4 shadow-sm transition-all ${
                  isInProgress
                    ? 'border-l-4 border-[#0D6950] border-l-[#0D6950]'
                    : 'border-[#E0E6E4]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded bg-[#F4F6F6] px-2 py-0.5 font-mono text-xs font-bold text-[#1F2926]">
                    {visit.code}
                  </span>
                  <VisitStatusBadge status={visit.status} />
                </div>

                <h2 className="mt-2 text-sm font-bold text-[#1F2926]">
                  {visit.clientName}
                </h2>
                <p className="text-xs font-semibold text-[#0D6950]">
                  {visit.title}
                </p>

                <div className="mt-3 space-y-1.5 rounded-md bg-[#F4F6F6]/70 p-2.5 text-xs text-[#1F2926]">
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0D6950]" />
                    <div>
                      <p className="font-semibold">
                        {visit.branchName} ({visit.branchZone})
                      </p>
                      <p className="text-[11px] text-[#78909C]">
                        {visit.branchAddress}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#1F2926]">
                      <Calendar className="h-3.5 w-3.5 text-[#78909C]" />
                      {visit.scheduledDate}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-[#0D6950]">
                      <Clock className="h-3.5 w-3.5" />
                      {visit.scheduledStartTime ?? '09:00'} -{' '}
                      {visit.scheduledEndTime ?? '11:00'} (
                      {visit.estimatedDurationMinutes}m)
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-t border-[#E0E6E4] pt-1.5 text-[11px]">
                    <span className="flex items-center gap-1 text-[#78909C]">
                      <Wrench className="h-3 w-3" />
                      Contacto: {visit.branchContactName}
                    </span>
                    <a
                      href={`tel:${visit.branchContactPhone}`}
                      className="inline-flex items-center gap-1 font-mono font-semibold text-[#0D6950] underline"
                    >
                      <Phone className="h-3 w-3" />
                      {visit.branchContactPhone}
                    </a>
                  </div>
                </div>

                <div className="mt-3">
                  <Button
                    asChild
                    className={`min-h-[48px] w-full text-xs font-bold text-white ${
                      isInProgress
                        ? 'bg-[#A8262B] hover:bg-[#8A1E22]'
                        : isClosed
                          ? 'bg-[#1F2926] hover:bg-[#1F2926]/90'
                          : 'bg-[#0D6950] hover:bg-[#0B533E]'
                    }`}
                  >
                    <Link to={`/field/visits/${visit.id}`}>
                      {isInProgress
                        ? 'Continuar Ejecución en Campo'
                        : isClosed
                          ? 'Ver Resumen de Acta Cerrada'
                          : 'Abrir Orden e Iniciar Traslado'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
