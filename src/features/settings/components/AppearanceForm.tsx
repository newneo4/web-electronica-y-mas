import { Monitor, Moon, PanelLeft, Sun } from 'lucide-react';
import { useUIStore, type ThemeMode } from '@/app/store/useUIStore';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

const BRAND_SWATCHES = [
  { name: 'Verde Principal', token: '--color-primary', hex: '#0D6950' },
  { name: 'Verde Oscuro / Hover', token: '--color-primary-dark', hex: '#0B533E' },
  { name: 'Rojo Acento (CTA)', token: '--color-accent', hex: '#A8262B' },
  { name: 'Rojo Hover', token: '--color-accent-hover', hex: '#8A1E22' },
  { name: 'Gris Oscuro Técnico', token: '--color-text-primary', hex: '#1F2926' },
  { name: 'Gris Neutro Medio', token: '--color-text-secondary', hex: '#78909C' },
  { name: 'Blanco Nieve (App BG)', token: '--color-bg-app', hex: '#F4F6F6' },
  { name: 'Borde Estándar', token: '--color-border', hex: '#E0E6E4' },
];

export function AppearanceForm() {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  const isSidebarCollapsed = useUIStore((state) => state.isSidebarCollapsed);
  const setSidebarCollapsed = useUIStore((state) => state.setSidebarCollapsed);

  const themeOptions: {
    mode: ThemeMode;
    title: string;
    description: string;
    icon: typeof Sun;
  }[] = [
    {
      mode: 'light',
      title: 'Modo Claro Oficial (#F4F6F6 + #FFFFFF)',
      description:
        'Superficie Blanco Puro sobre fondo Blanco Nieve y Sidebar en Gris Oscuro Técnico (#1F2926).',
      icon: Sun,
    },
    {
      mode: 'dark',
      title: 'Modo Oscuro Técnico (#141B19 + #1F2926)',
      description:
        'Contraste nocturno basado en la paleta técnica de Electrónica & Más EIRL.',
      icon: Moon,
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Apariencia y Espacio de Trabajo</CardTitle>
          <CardDescription>
            Configuración visual alineada con el Design System v1.0.0 de{' '}
            <strong>Electrónica &amp; Más EIRL</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2.5">
            <p className="text-[14px] font-semibold text-foreground">
              Tema de Interfaz
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {themeOptions.map((item) => {
                const Icon = item.icon;
                const isSelected = theme === item.mode;
                return (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setTheme(item.mode)}
                    className={cn(
                      'flex items-start gap-3 rounded-[12px] border p-4 text-left transition-colors',
                      isSelected
                        ? 'border-[2px] border-[#0D6950] bg-[#0D6950]/5'
                        : 'hover:bg-accent/50'
                    )}
                  >
                    <Icon className="mt-0.5 h-5 w-5 text-[#0D6950]" />
                    <div className="space-y-1">
                      <p className="text-[14px] font-semibold text-foreground">
                        {item.title}
                      </p>
                      <p className="text-[12px] text-[#78909C]">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-3 rounded-[12px] border bg-background p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <PanelLeft className="mt-0.5 h-5 w-5 text-[#0D6950]" />
              <div>
                <p className="text-[14px] font-semibold text-foreground">
                  Densidad del Sidebar (#1F2926)
                </p>
                <p className="text-[12px] text-[#78909C]">
                  Alterna entre el logotipo horizontal completo (mín. 140px) o
                  el isotipo aislado (onda sinusoidal).
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span>
                {isSidebarCollapsed ? 'Expandir Sidebar' : 'Colapsar a Isotipo'}
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Muestra del Sistema de Diseño y Variantes de Logo */}
      <Card>
        <CardHeader>
          <CardTitle>Design Tokens &amp; Variantes de Marca Activas</CardTitle>
          <CardDescription>
            Referencia en vivo de colores, botones y variantes del logotipo
            implementados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Variantes del Logo (Sección 1.2) */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col items-center justify-center gap-2 rounded-[12px] bg-[#0D6950] p-4 text-white">
              <BrandLogo variant="horizontal" tone="dark-bg" />
              <span className="font-mono text-[11px] text-white/80">
                1. Principal (Fondo #0D6950)
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 rounded-[12px] bg-[#1F2926] p-4 text-white">
              <BrandLogo variant="horizontal" tone="dark-bg" />
              <span className="font-mono text-[11px] text-white/80">
                2. Navbar / Sidebar (#1F2926)
              </span>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 rounded-[12px] border bg-background p-4">
              <BrandLogo variant="icon" />
              <span className="font-mono text-[11px] text-[#78909C]">
                3. Isotipo Aislado (Onda)
              </span>
            </div>
          </div>

          {/* Paleta de Tokens (Sección 2) */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {BRAND_SWATCHES.map((swatch) => (
              <div
                key={swatch.token}
                className="flex items-center gap-3 rounded-[8px] border p-2.5"
              >
                <span
                  className="h-8 w-8 shrink-0 rounded-[6px] border border-black/10 shadow-sm"
                  style={{ backgroundColor: swatch.hex }}
                />
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-foreground">
                    {swatch.name}
                  </p>
                  <p className="font-mono text-[11px] text-[#78909C]">
                    {swatch.hex}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
