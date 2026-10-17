import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Botones según Sección 5.1 de la Guía de Estilos:
 * - default (Primario Verde Corporativo): Fondo #0D6950, Texto #FFFFFF, Hover #0B533E, Radio 8px
 * - cta / destructive (Call to Action Rojo Acento): Fondo #A8262B, Texto #FFFFFF, Hover #8A1E22, Radio 8px
 * - outline (Fantasma / Outline): Borde 1.5px sólido #0D6950, Fondo transparente, Texto #0D6950, Hover #0D6950 texto #FFFFFF
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D6950] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[#0D6950] text-white hover:bg-[#0B533E] shadow-sm',
        cta: 'bg-[#A8262B] text-white hover:bg-[#8A1E22] shadow-sm',
        destructive:
          'bg-[#A8262B] text-white hover:bg-[#8A1E22] shadow-sm',
        outline:
          'border-[1.5px] border-[#0D6950] bg-transparent text-[#0D6950] hover:bg-[#0D6950] hover:text-white dark:border-[#199A76] dark:text-[#42C6A1] dark:hover:bg-[#0D6950] dark:hover:text-white',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost:
          'text-foreground hover:bg-[#0D6950]/10 hover:text-[#0D6950] dark:hover:text-[#42C6A1]',
        link: 'text-[#0D6950] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[40px] px-4 py-2',
        sm: 'h-[34px] rounded-[8px] px-3 text-[12px]',
        lg: 'h-[44px] rounded-[8px] px-6',
        icon: 'h-[40px] w-[40px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
