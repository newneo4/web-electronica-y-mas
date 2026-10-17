import {
  Activity,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
} from 'lucide-react';
import { SineWaveWatermark } from '@/components/common/SineWaveWatermark';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DailyDashboardSummary } from '@/features/dashboard/types/dashboard.types';
import { cn } from '@/lib/utils';

interface DailyKpiCardsProps {
  summary?: DailyDashboardSummary;
  isLoading: boolean;
}

/**
 * DailyKpiCards (Feature 01 — Sección 4):
 * 5 tarjetas superiores con contadores e íconos:
 * 1. Visitas del Día
 * 2. Por Programar
 * 3. En Curso
 * 4. Terminadas
 * 5. Vencidas (destacada en Rojo Acento #A8262B si es > 0)
 */
export function DailyKpiCards({ summary, isLoading }: DailyKpiCardsProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
              <Skeleton className="mt-3 h-7 w-16" />
              <Skeleton className="mt-2 h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const hasOverdue = summary.overdueCount > 0;

  const cards = [
    {
      id: 'total-today',
      title: 'Visitas del Día',
      value: summary.totalToday,
      subtitle: 'Programadas para hoy',
      icon: ClipboardCheck,
      accentColor: '#0D6950',
      isCritical: false,
    },
    {
      id: 'to-schedule',
      title: 'Por Programar',
      value: summary.toScheduleCount,
      subtitle: 'Sin técnico u horario',
      icon: CalendarClock,
      accentColor: '#78909C',
      isCritical: false,
    },
    {
      id: 'in-progress',
      title: 'En Curso / Traslado',
      value: summary.inProgressCount,
      subtitle: 'Atención activa en campo',
      icon: Activity,
      accentColor: '#0D6950',
      isCritical: false,
    },
    {
      id: 'completed',
      title: 'Terminadas',
      value: summary.completedCount,
      subtitle: 'Cerradas con acta hoy',
      icon: CheckCircle2,
      accentColor: '#0D6950',
      isCritical: false,
    },
    {
      id: 'overdue',
      title: 'Visitas Vencidas',
      value: summary.overdueCount,
      subtitle: hasOverdue
        ? 'Requieren reprogramación urgente'
        : 'Sin atrasos pendientes',
      icon: AlertTriangle,
      accentColor: '#A8262B',
      isCritical: hasOverdue,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.id}
            className={cn(
              'relative overflow-hidden transition-all duration-200',
              card.isCritical
                ? 'border-[1.5px] border-[#A8262B] bg-[#A8262B]/[0.03]'
                : 'hover:border-[#0D6950]/40'
            )}
          >
            <SineWaveWatermark
              className={cn(
                'absolute -right-6 -top-2 h-14 w-40',
                card.isCritical && 'text-[#A8262B]'
              )}
            />
            <CardContent className="relative z-10 p-5">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'text-[12px] font-semibold uppercase tracking-wider',
                    card.isCritical ? 'text-[#A8262B]' : 'text-[#78909C]'
                  )}
                >
                  {card.title}
                </span>
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border',
                    card.isCritical
                      ? 'border-[#A8262B]/30 bg-[#A8262B]/15 text-[#A8262B]'
                      : 'border-[#0D6950]/20 bg-[#0D6950]/10 text-[#0D6950]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-3 flex items-baseline justify-between">
                <span
                  className={cn(
                    'font-mono text-[24px] font-bold leading-none',
                    card.isCritical ? 'text-[#A8262B]' : 'text-foreground'
                  )}
                >
                  {card.value}
                </span>
              </div>

              <p
                className={cn(
                  'mt-2 text-[12px]',
                  card.isCritical
                    ? 'font-medium text-[#A8262B]'
                    : 'text-[#78909C]'
                )}
              >
                {card.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
