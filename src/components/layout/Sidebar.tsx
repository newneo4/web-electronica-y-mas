import { NavLink } from 'react-router-dom';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
} from 'lucide-react';
import { NAVIGATION_ITEMS } from '@/app/router/navigation';
import { useUIStore } from '@/app/store/useUIStore';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { BrandLogo } from '@/components/common/BrandLogo';
import { SineWaveWatermark } from '@/components/common/SineWaveWatermark';
import { cn } from '@/lib/utils';

/**
 * Sidebar Fija en Tono Neutro Oscuro #1F2926 (Sección 6.3 y 4.2):
 * - Fondo fijo #1F2926 para máxima jerarquía visual.
 * - Iconos activos en #0D6950, inactivos en #78909C y badges de alerta en #A8262B.
 */
export function Sidebar() {
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);
  const { hasRole, role } = usePermissions();

  // Filtrado dinámico de enlaces según el rol del usuario autenticado
  const allowedNavItems = NAVIGATION_ITEMS.filter((item) =>
    hasRole(item.roles)
  );

  return (
    <aside
      className={cn(
        'relative flex h-screen shrink-0 flex-col border-r border-[#2C3A36] bg-[#1F2926] text-white transition-all duration-200',
        isSidebarCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Brand Header con área de reserva (Sección 1.2 y 1.3) */}
      <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
        <BrandLogo
          variant={isSidebarCollapsed ? 'icon' : 'horizontal'}
          tone="dark-bg"
          className={cn(isSidebarCollapsed && 'mx-auto')}
        />

        {!isSidebarCollapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            title="Colapsar barra lateral"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-[#78909C] transition-colors hover:bg-white/10 hover:text-white"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Links (Espaciado múltiplo de 8px — Sección 6.2) */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-6">
        {!isSidebarCollapsed && (
          <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#78909C]">
            Módulos Operativos
          </p>
        )}

        {allowedNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              title={isSidebarCollapsed ? item.title : undefined}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[14px] font-medium transition-colors',
                  isActive
                    ? 'bg-[#0D6950] text-white shadow-sm'
                    : 'text-[#E0E6E4]/80 hover:bg-[#0B533E]/50 hover:text-white',
                  isSidebarCollapsed && 'justify-center px-0'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={cn(
                      'h-5 w-5 shrink-0 transition-colors',
                      isActive
                        ? 'text-white'
                        : 'text-[#78909C] group-hover:text-white'
                    )}
                  />
                  {!isSidebarCollapsed && (
                    <>
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.badge && (
                        <span className="rounded-[6px] bg-[#A8262B] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info & Collapse Toggle when collapsed */}
      <div className="relative overflow-hidden border-t border-white/10 p-3">
        <SineWaveWatermark className="absolute -bottom-2 left-0 w-full text-white opacity-[0.06]" />
        {isSidebarCollapsed ? (
          <button
            type="button"
            onClick={toggleSidebar}
            title="Expandir barra lateral"
            className="relative z-10 mx-auto flex h-9 w-9 items-center justify-center rounded-[8px] text-[#78909C] transition-colors hover:bg-white/10 hover:text-white"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </button>
        ) : (
          <div className="relative z-10 flex items-center justify-between rounded-[8px] border border-white/10 bg-[#0B533E]/40 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <Shield className="h-4 w-4 text-[#42C6A1]" />
              <div className="text-[12px]">
                <p className="font-semibold text-white">Nivel RBAC</p>
                <p className="font-mono text-[11px] text-[#E0E6E4]/80">
                  Rol: {role}
                </p>
              </div>
            </div>
            <span className="rounded bg-[#0D6950] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-white">
              v1.0
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
