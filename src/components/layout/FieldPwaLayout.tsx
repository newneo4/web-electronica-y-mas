import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  CalendarCheck2,
  LogOut,
  Smartphone,
  UserCheck,
  Wifi,
} from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { RoleSwitcher } from '@/features/auth/components/RoleSwitcher';
import { BrandLogo } from '@/components/common/BrandLogo';
import { cn } from '@/lib/utils';

/**
 * FieldPwaLayout — Entregable B (App Móvil PWA para Técnicos):
 * - Topbar compacta en Verde Principal (#0D6950) con estado de red y usuario.
 * - Contenedor móvil centrado (max-w-md) con botones táctiles >= 48px.
 * - Regla 6.3 del Design System: Barra inferior de navegación en fondo #FFFFFF
 *   con iconos activos en #0D6950 e inactivos en #78909C.
 */
export function FieldPwaLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#1F2926]/95 flex flex-col items-center">
      {/* Barra superior informativa para entorno de pruebas Web/Desktop */}
      <div className="w-full border-b border-white/10 bg-[#1F2926] px-4 py-2">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[12px] text-white/85">
            <Smartphone className="h-4 w-4 text-[#42C6A1]" />
            <span>
              <strong>Modo App Móvil PWA (Android)</strong> • Rol activo:{' '}
              <code className="font-mono text-[#42C6A1]">{user?.role}</code> (
              {user?.name})
            </span>
          </div>
          <RoleSwitcher />
        </div>
      </div>

      {/* Marco Móvil PWA (max-w-md) */}
      <div className="relative flex min-h-[calc(100vh-45px)] w-full max-w-md flex-col bg-[#F4F6F6] text-[#1F2926] shadow-2xl">
        {/* Topbar Compacta PWA en #0D6950 */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-[#0D6950] px-4 text-white shadow-sm">
          <BrandLogo variant="horizontal" tone="dark-bg" />

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0B533E] px-2.5 py-1 font-mono text-[11px] font-medium text-white">
              <Wifi className="h-3 w-3 text-[#42C6A1]" />
              Online
            </span>
          </div>
        </header>

        {/* Contenido Principal de la Vista Móvil */}
        <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          <Outlet />
        </main>

        {/* Bottom Navigation Bar en #FFFFFF con iconos activos en #0D6950 (Sección 6.3) */}
        <nav
          aria-label="Navegación Móvil PWA"
          className="fixed bottom-0 z-30 flex h-16 w-full max-w-md items-center justify-around border-t border-[#E0E6E4] bg-[#FFFFFF] px-2 shadow-[0_-4px_12px_rgba(31,41,38,0.06)]"
        >
          <NavLink
            to="/field/agenda"
            className={({ isActive }) =>
              cn(
                'flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-[8px] text-[11px] font-semibold transition-colors',
                isActive ? 'text-[#0D6950]' : 'text-[#78909C]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <CalendarCheck2
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-[#0D6950]' : 'text-[#78909C]'
                  )}
                />
                <span>Mi Agenda</span>
              </>
            )}
          </NavLink>

          <div className="flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] text-[#78909C]">
            <UserCheck className="h-5 w-5 text-[#0D6950]" />
            <span className="max-w-[110px] truncate font-medium text-[#1F2926]">
              {user?.name.split(' ')[0]}
            </span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[48px] flex-1 flex-col items-center justify-center gap-1 rounded-[8px] text-[11px] font-semibold text-[#78909C] transition-colors hover:text-[#A8262B]"
          >
            <LogOut className="h-5 w-5" />
            <span>Salir</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
