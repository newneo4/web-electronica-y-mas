import { cn } from '@/lib/utils';

interface BrandLogoProps {
  variant?: 'horizontal' | 'icon' | 'mono';
  tone?: 'dark-bg' | 'light-bg';
  className?: string;
}

/**
 * Identidad Visual Oficial — Electrónica & Más EIRL (Sección 1.1 y 1.2)
 * - Isotipo: Esfera con degradado verde azulado (#0D6950 -> #0B533E) atravesada
 *   por una onda sinusoidal blanca y una línea horizontal de referencia de señal.
 * - Logotipo: Letra inicial "e" destacada en círculo rojo de acento (#A8262B),
 *   texto "lectrónica" y leyenda inferior "& Más EIRL" alineada a la derecha.
 */
export function BrandLogo({
  variant = 'horizontal',
  tone = 'dark-bg',
  className,
}: BrandLogoProps) {
  const isMono = variant === 'mono';

  return (
    <div
      className={cn(
        'inline-flex items-center gap-3 select-none',
        variant !== 'icon' && 'min-w-[140px]',
        className
      )}
    >
      {/* Isotipo: Esfera con onda sinusoidal y línea de referencia (mín. 24x24px) */}
      <svg
        viewBox="0 0 48 48"
        className="h-9 w-9 min-h-[24px] min-w-[24px] shrink-0 drop-shadow-sm"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="brandSphereGrad"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={isMono ? '#78909C' : '#128264'}
            />
            <stop
              offset="55%"
              stopColor={isMono ? '#1F2926' : '#0D6950'}
            />
            <stop
              offset="100%"
              stopColor={isMono ? '#141B19' : '#0B533E'}
            />
          </linearGradient>
        </defs>
        <circle
          cx="24"
          cy="24"
          r="22"
          fill="url(#brandSphereGrad)"
          stroke="rgba(255,255,255,0.18)"
          strokeWidth="1.2"
        />
        {/* Línea horizontal de referencia de señal */}
        <line
          x1="4"
          y1="24"
          x2="44"
          y2="24"
          stroke="rgba(255, 255, 255, 0.35)"
          strokeWidth="1.5"
          strokeDasharray="2 2"
        />
        {/* Onda sinusoidal blanca */}
        <path
          d="M 6 24 C 12 7, 18 7, 24 24 C 30 41, 36 41, 42 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {variant !== 'icon' && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center">
            <span
              className={cn(
                'text-[16px] font-bold tracking-tight',
                tone === 'dark-bg'
                  ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]'
                  : 'text-[#1F2926] dark:text-white'
              )}
            >
              Electrónica
            </span>
          </div>
          {/* Leyenda inferior "& Más EIRL" alineada a la derecha */}
          <span
            className={cn(
              'mt-0.5 self-end text-[10px] font-semibold uppercase tracking-[0.14em]',
              tone === 'dark-bg'
                ? 'text-[#E0E6E4]/85'
                : 'text-[#78909C]'
            )}
          >
            &amp; Más EIRL
          </span>
        </div>
      )}
    </div>
  );
}
