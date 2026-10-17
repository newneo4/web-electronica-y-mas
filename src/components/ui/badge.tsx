import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badges alineados con los tokens de Feedback (Sección 2.3):
 * --status-success: #0D6950
 * --status-error: #A8262B
 * --status-warning: #E29528
 * --status-info: #2B7A9B
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-[6px] border px-2.5 py-0.5 text-[12px] font-semibold transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#0D6950] text-white',
        secondary:
          'border-[#E0E6E4] bg-[#F4F6F6] text-[#1F2926] dark:border-border dark:bg-secondary dark:text-secondary-foreground',
        destructive: 'border-transparent bg-[#A8262B] text-white',
        outline: 'border-border text-foreground',
        success:
          'border-[#0D6950]/30 bg-[#0D6950]/10 text-[#0D6950] dark:text-[#42C6A1]',
        warning:
          'border-[#E29528]/35 bg-[#E29528]/12 text-[#B87314] dark:text-[#F2AE49]',
        info:
          'border-[#2B7A9B]/30 bg-[#2B7A9B]/10 text-[#2B7A9B] dark:text-[#63B3D4]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
