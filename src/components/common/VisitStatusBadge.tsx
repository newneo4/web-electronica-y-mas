import type { VisitStatus } from '@/types/field.types';
import { cn } from '@/lib/utils';

interface VisitStatusConfig {
  label: string;
  dotColor: string;
  className: string;
}

/**
 * Máquina de Estados de una Visita (Sección 3.1 de la Especificación):
 * Utiliza exclusivamente los tokens de color del Design System de Electrónica & Más EIRL:
 * - POR_PROGRAMAR: #78909C (Gris)
 * - PROGRAMADA: #2B7A9B (Azul)
 * - EN_TRASLADO: #E29528 (Ámbar)
 * - EN_CURSO: #0D6950 (Verde)
 * - PAUSADA: #D97706 (Naranja)
 * - COMPLETADA: #0D6950 (Éxito)
 * - CON_PENDIENTES: #A8262B (Rojo)
 * - VENCIDA: #8A1E22 (Rojo Oscuro)
 */
export const VISIT_STATUS_META: Record<VisitStatus, VisitStatusConfig> = {
  POR_PROGRAMAR: {
    label: 'Por programar',
    dotColor: '#78909C',
    className:
      'border-[#78909C]/35 bg-[#78909C]/12 text-[#546E7A] dark:text-[#B0BEC5]',
  },
  PROGRAMADA: {
    label: 'Programada',
    dotColor: '#2B7A9B',
    className:
      'border-[#2B7A9B]/35 bg-[#2B7A9B]/12 text-[#2B7A9B] dark:text-[#63B3D4]',
  },
  EN_TRASLADO: {
    label: 'En traslado',
    dotColor: '#E29528',
    className:
      'border-[#E29528]/40 bg-[#E29528]/14 text-[#B87314] dark:text-[#F2AE49]',
  },
  EN_CURSO: {
    label: 'En atención',
    dotColor: '#0D6950',
    className:
      'border-[#0D6950]/40 bg-[#0D6950]/14 text-[#0D6950] dark:text-[#42C6A1]',
  },
  PAUSADA: {
    label: 'En pausa',
    dotColor: '#D97706',
    className:
      'border-[#D97706]/40 bg-[#D97706]/14 text-[#B45309] dark:text-[#FBBF24]',
  },
  COMPLETADA: {
    label: 'Terminada',
    dotColor: '#0D6950',
    className: 'border-transparent bg-[#0D6950] text-white',
  },
  CON_PENDIENTES: {
    label: 'Con pendientes',
    dotColor: '#A8262B',
    className:
      'border-[#A8262B]/40 bg-[#A8262B]/12 text-[#A8262B] dark:text-[#EF6B70]',
  },
  VENCIDA: {
    label: 'Vencida',
    dotColor: '#8A1E22',
    className: 'border-transparent bg-[#8A1E22] text-white',
  },
};

interface VisitStatusBadgeProps {
  status: VisitStatus;
  className?: string;
}

export function VisitStatusBadge({ status, className }: VisitStatusBadgeProps) {
  const meta = VISIT_STATUS_META[status];
  const isSolid = status === 'COMPLETADA' || status === 'VENCIDA';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-0.5 text-[12px] font-semibold whitespace-nowrap',
        meta.className,
        className
      )}
    >
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{
          backgroundColor: isSolid ? '#FFFFFF' : meta.dotColor,
        }}
      />
      <span>{meta.label}</span>
    </span>
  );
}
