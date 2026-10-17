import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  Eye,
  MapPin,
  Search,
} from 'lucide-react';
import { VisitStatusBadge } from '@/components/common/VisitStatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { EnrichedVisit, VisitStatus } from '@/types/field.types';

interface TodayVisitsTableProps {
  visits?: EnrichedVisit[];
  isLoading: boolean;
}

export function TodayVisitsTable({
  visits = [],
  isLoading,
}: TodayVisitsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredVisits = visits.filter((visit) => {
    const matchesStatus =
      statusFilter === 'ALL' || visit.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !term ||
      visit.clientName.toLowerCase().includes(term) ||
      visit.branchName.toLowerCase().includes(term) ||
      (visit.technicianName?.toLowerCase().includes(term) ?? false) ||
      visit.code.toLowerCase().includes(term);

    return matchesStatus && matchesSearch;
  });

  const getChecklistProgress = (visit: EnrichedVisit) => {
    const items = visit.execution?.checklistResults ?? [];
    if (items.length === 0) {
      return visit.status === 'COMPLETADA' ? 100 : 0;
    }
    const done = items.filter((i) => i.completed).length;
    return Math.round((done / items.length) * 100);
  };

  return (
    <Card className="col-span-1 lg:col-span-5">
      <CardHeader className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <CardTitle>Agenda Operativa y Visitas Accionables</CardTitle>
            <CardDescription>
              Seguimiento en vivo de horas programadas, sedes, técnicos y avance
              del checklist.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/schedule">
              <CalendarClock className="h-4 w-4" />
              <span>Ir a Agenda Completa</span>
            </Link>
          </Button>
        </div>

        {/* Filtros rápidos */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#78909C]" />
            <Input
              placeholder="Buscar por cliente, sede, código o técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[210px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los estados</SelectItem>
              <SelectItem value="POR_PROGRAMAR">Por programar</SelectItem>
              <SelectItem value="PROGRAMADA">Programada</SelectItem>
              <SelectItem value="EN_TRASLADO">En traslado</SelectItem>
              <SelectItem value="EN_CURSO">En atención</SelectItem>
              <SelectItem value="PAUSADA">En pausa</SelectItem>
              <SelectItem value="COMPLETADA">Terminada</SelectItem>
              <SelectItem value="CON_PENDIENTES">Con pendientes</SelectItem>
              <SelectItem value="VENCIDA">Vencida</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-14 w-full rounded-[8px]" />
            ))}
          </div>
        ) : filteredVisits.length === 0 ? (
          <EmptyState
            title="Sin visitas para el filtro seleccionado"
            description="Prueba cambiando el estado o limpiando el término de búsqueda."
          />
        ) : (
          <div className="rounded-[8px] border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horario / Código</TableHead>
                  <TableHead>Cliente / Sede</TableHead>
                  <TableHead>Técnico Asignado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVisits.map((visit) => {
                  const progress = getChecklistProgress(visit);
                  const needsAssignmentOrReschedule: VisitStatus[] = [
                    'POR_PROGRAMAR',
                    'VENCIDA',
                  ];
                  const isUrgentAction = needsAssignmentOrReschedule.includes(
                    visit.status
                  );

                  return (
                    <TableRow key={visit.id}>
                      <TableCell>
                        <div className="font-mono text-[12px] font-semibold text-foreground">
                          {visit.scheduledStartTime
                            ? `${visit.scheduledStartTime} - ${visit.scheduledEndTime ?? ''}`
                            : 'Sin hora'}
                        </div>
                        <div className="font-mono text-[11px] text-[#78909C]">
                          {visit.code} • {visit.scheduledDate}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Link
                          to={`/admin/clients/${visit.clientId}`}
                          className="text-[14px] font-semibold text-foreground hover:text-[#0D6950] hover:underline"
                        >
                          {visit.clientName}
                        </Link>
                        <div className="flex items-center gap-1 text-[12px] text-[#78909C]">
                          <MapPin className="h-3 w-3 shrink-0 text-[#0D6950]" />
                          <span>
                            {visit.branchName} ({visit.branchZone})
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        {visit.technicianName ? (
                          <div>
                            <p className="text-[13px] font-medium text-foreground">
                              {visit.technicianName}
                            </p>
                            <p className="text-[11px] text-[#78909C]">
                              {visit.requiredSpecialty}
                            </p>
                          </div>
                        ) : (
                          <span className="text-[12px] font-medium text-[#A8262B]">
                            Sin técnico asignado
                          </span>
                        )}
                      </TableCell>

                      <TableCell>
                        <VisitStatusBadge status={visit.status} />
                      </TableCell>

                      <TableCell>
                        <div className="w-28 space-y-1">
                          <div className="flex justify-between font-mono text-[11px]">
                            <span className="text-[#78909C]">Checklist</span>
                            <span className="font-semibold text-foreground">
                              {progress}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              style={{ width: `${progress}%` }}
                              className="h-full rounded-full bg-[#0D6950] transition-all"
                            />
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        {isUrgentAction ? (
                          <Button
                            variant={
                              visit.status === 'VENCIDA' ? 'cta' : 'default'
                            }
                            size="sm"
                            asChild
                          >
                            <Link to={`/admin/schedule?visitId=${visit.id}`}>
                              <span>
                                {visit.status === 'VENCIDA'
                                  ? 'Reprogramar'
                                  : 'Asignar'}
                              </span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        ) : (
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/admin/monitoring?visitId=${visit.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                              <span>Monitorear</span>
                            </Link>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
