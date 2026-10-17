import { cn } from '@/lib/utils';

interface SineWaveWatermarkProps {
  className?: string;
}

/**
 * La Onda Sinusoidal (Graphic Device — Sección 4.1)
 * Textura o marca de agua sutil (opacidad entre 5% y 12%) en encabezados de
 * tarjetas métricas, pantallas de carga o banners promocionales.
 */
export function SineWaveWatermark({ className }: SineWaveWatermarkProps) {
  return (
    <svg
      viewBox="0 0 240 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={cn(
        'pointer-events-none select-none opacity-[0.08] text-[#0D6950] dark:opacity-[0.12]',
        className
      )}
    >
      <line
        x1="0"
        y1="32"
        x2="240"
        y2="32"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <path
        d="M 0 32 C 30 4, 50 4, 80 32 C 110 60, 130 60, 160 32 C 190 4, 210 4, 240 32"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
