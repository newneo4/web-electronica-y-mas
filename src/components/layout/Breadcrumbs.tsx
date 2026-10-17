import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { NAVIGATION_ITEMS } from '@/app/router/navigation';

const ROUTE_LABELS: Record<string, string> = {
  admin: 'Consola Web',
  dashboard: 'Tablero del Día',
  clients: 'Clientes y Sedes',
  technicians: 'Técnicos de Campo',
  'service-plans': 'Planes Preventivos',
  schedule: 'Agenda y Despacho',
  monitoring: 'Monitoreo en Vivo',
  reports: 'Reportes y SLA',
  users: 'Usuarios y Accesos',
  settings: 'Configuración',
  unauthorized: 'Acceso Restringido (403)',
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname
    .split('/')
    .filter((seg) => Boolean(seg) && seg !== 'admin');

  const activeNav = NAVIGATION_ITEMS.find((item) =>
    location.pathname.startsWith(item.href)
  );

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-[14px]">
      <ol className="flex items-center gap-1.5 text-[#78909C]">
        <li>
          <Link
            to="/admin/dashboard"
            className="flex items-center gap-1.5 font-medium transition-colors hover:text-[#0D6950]"
          >
            <Home className="h-4 w-4 text-[#0D6950]" />
          </Link>
        </li>
        {segments.map((segment, index) => {
          const href = `/admin/${segments.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;
          const label =
            ROUTE_LABELS[segment] ?? activeNav?.title ?? segment;

          return (
            <li key={href} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5 text-[#78909C]" />
              {isLast ? (
                <span className="font-semibold text-foreground">{label}</span>
              ) : (
                <Link
                  to={href}
                  className="transition-colors hover:text-[#0D6950]"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
