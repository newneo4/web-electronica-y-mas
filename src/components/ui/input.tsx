import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

/**
 * Campos de Formulario (Inputs — Sección 5.3):
 * - Fondo: #FFFFFF (bg-card)
 * - Altura: 44px (web)
 * - Borde por defecto: 1px sólido #E0E6E4
 * - Borde en foco (focus): 2px sólido #0D6950
 * - Radio de borde: 8px
 */
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-[44px] w-full rounded-[8px] border border-input bg-card px-3.5 py-2 text-[14px] text-foreground transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#78909C] focus-visible:border-[2px] focus-visible:border-[#0D6950] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
