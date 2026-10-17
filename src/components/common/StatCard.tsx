import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { SineWaveWatermark } from '@/components/common/SineWaveWatermark';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface StatCardProps {
  title: string;
  value: string;
  changeLabel: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  isLoading?: boolean;
}

/**
 * Tarjeta Métrica (Sección 4.1 y 5.2 de la Guía de Estilos):
 * - Marca de agua de onda sinusoidal sutil (opacidad 8%) en el encabezado.
 * - Número principal en peso Bold (24px) en familia Monospace (JetBrains Mono)
 *   acompañado de un indicador circular y línea de señal en verde #0D6950.
 */
export function StatCard({
  title,
  value,
  changeLabel,
  trend,
  icon: Icon,
  isLoading = false,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
          <Skeleton className="mt-4 h-7 w-32" />
          <Skeleton className="mt-2 h-3.5 w-40" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:border-[#0D6950]/40 hover:shadow-card-hover">
      {/* Marca de agua de onda sinusoidal sutil (Sección 4.1) */}
      <SineWaveWatermark className="absolute -right-4 -top-2 h-16 w-48" />

      <CardContent className="relative z-10 p-6">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium uppercase tracking-wider text-[#78909C]">
            {title}
          </span>
          {/* Indicador circular en verde #0D6950 (Sección 5.2) */}
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#0D6950]/20 bg-[#0D6950]/10 text-[#0D6950] dark:text-[#42C6A1]">
            <Icon className="h-4 w-4" />
          </div>
        </div>

        {/* Número principal en Bold (24px) y Monospace + mini línea en verde #0D6950 */}
        <div className="mt-3 flex items-end justify-between gap-2">
          <p className="font-mono text-[24px] font-bold leading-none tracking-tight text-foreground">
            {value}
          </p>
          <svg
            viewBox="0 0 64 20"
            className="h-5 w-16 shrink-0 text-[#0D6950]"
            fill="none"
            aria-hidden="true"
          >
            <path
              d={
                trend === 'down'
                  ? 'M2 4 C 16 6, 24 14, 38 12 C 48 11, 54 16, 62 17'
                  : 'M2 16 C 14 15, 22 8, 34 11 C 46 13, 52 5, 62 3'
              }
              stroke={trend === 'down' ? '#A8262B' : '#0D6950'}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[12px]">
          {trend === 'up' && (
            <span className="inline-flex items-center font-medium text-[#0D6950] dark:text-[#42C6A1]">
              <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
              {changeLabel}
            </span>
          )}
          {trend === 'down' && (
            <span className="inline-flex items-center font-medium text-[#A8262B] dark:text-[#EF6B70]">
              <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
              {changeLabel}
            </span>
          )}
          {trend === 'neutral' && (
            <span className={cn('text-[#78909C]')}>{changeLabel}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
