import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Role } from '@/features/auth/types/auth.types';
import { cn } from '@/lib/utils';

const AVAILABLE_ROLES: { role: Role; label: string }[] = [
  { role: 'ADMIN', label: 'ADMIN' },
  { role: 'COORDINADOR', label: 'COORD' },
  { role: 'SUPERVISOR', label: 'SUPERV' },
  { role: 'TECNICO', label: 'PWA TÉCNICO' },
];

export function RoleSwitcher() {
  const { user, switchRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user) return null;

  const handleSwitchRole = (nextRole: Role) => {
    switchRole(nextRole);
    if (nextRole === 'TECNICO' && !location.pathname.startsWith('/field')) {
      navigate('/field/agenda', { replace: true });
    } else if (
      nextRole !== 'TECNICO' &&
      location.pathname.startsWith('/field')
    ) {
      navigate('/admin/dashboard', { replace: true });
    }
  };

  return (
    <div
      className="flex items-center gap-1.5 rounded-[8px] border border-[#0D6950]/30 bg-[#0D6950]/5 px-2 py-1"
      title="Conmutador de rol en caliente para demostrar RBAC Web y App Móvil PWA"
    >
      <span className="hidden items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-[#0D6950] xl:inline-flex">
        <ShieldAlert className="h-3.5 w-3.5" />
        Dev RBAC:
      </span>
      <div className="flex items-center gap-1">
        {AVAILABLE_ROLES.map((item) => {
          const isActive = user.role === item.role;
          const isPwaRole = item.role === 'TECNICO';
          return (
            <button
              key={item.role}
              type="button"
              onClick={() => handleSwitchRole(item.role)}
              className={cn(
                'rounded-[6px] px-2 py-0.5 text-[11px] font-semibold transition-colors',
                isActive
                  ? isPwaRole
                    ? 'bg-[#A8262B] text-white shadow-sm'
                    : 'bg-[#0D6950] text-white shadow-sm'
                  : 'text-[#78909C] hover:bg-[#0D6950]/10 hover:text-foreground'
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
