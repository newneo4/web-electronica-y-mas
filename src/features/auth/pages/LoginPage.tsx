import { Navigate } from 'react-router-dom';
import { Activity, Layers, LockKeyhole, Radio } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { BrandLogo } from '@/components/common/BrandLogo';
import { SineWaveWatermark } from '@/components/common/SineWaveWatermark';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * LoginPage — Incluye Variante 1.2.1 del Logo (Principal Full Color / Fondo Verde #0D6950)
 * y La Onda Sinusoidal como Graphic Device (Sección 4.1).
 */
export function LoginPage() {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return (
      <Navigate
        to={user?.role === 'TECNICO' ? '/field/agenda' : '/admin/dashboard'}
        replace
      />
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Left Column: Banner Principal sobre Fondo Verde Corporativo #0D6950 (Sección 1.2.1) */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0D6950] via-[#0D6950] to-[#0B533E] p-12 text-white lg:flex">
        {/* Marca de agua de onda sinusoidal (Sección 4.1) */}
        <SineWaveWatermark className="absolute -right-12 top-24 h-64 w-[520px] text-white opacity-[0.10]" />
        <SineWaveWatermark className="absolute -left-16 bottom-16 h-56 w-[460px] text-white opacity-[0.08]" />

        <div className="relative z-10 flex items-center justify-between">
          <BrandLogo variant="horizontal" tone="dark-bg" />
          <span className="rounded-[6px] border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-[12px] font-medium text-white">
            B2B SaaS OS v1.0
          </span>
        </div>

        <div className="relative z-10 max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12px] font-medium">
            <Activity className="h-3.5 w-3.5 text-white" />
            <span>Precisión Técnica &amp; Abastecimiento Electrónico</span>
          </div>

          <h1 className="text-[32px] font-bold leading-[1.2] text-white">
            Plataforma de Gestión Mayorista e Inventario Electrónico.
          </h1>
          <p className="text-[16px] leading-[1.5] text-white/85">
            Control centralizado de distribuidores, telemetría de stock,
            cotizaciones por volumen y permisos basados en roles (RBAC) para{' '}
            <strong>Electrónica &amp; Más EIRL</strong>.
          </p>

          <div className="grid gap-3 pt-2">
            <div className="flex items-start gap-3 rounded-[12px] border border-white/15 bg-[#0B533E]/60 p-4 backdrop-blur-sm">
              <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-white" />
              <div className="text-[14px]">
                <p className="font-semibold text-white">
                  Control de Acceso Basado en Roles (RBAC)
                </p>
                <p className="text-[12px] text-white/80">
                  Perfiles diferenciados para ADMIN, MANAGER y VIEWER con
                  protección de rutas y menú lateral dinámico.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-[12px] border border-white/15 bg-[#0B533E]/60 p-4 backdrop-blur-sm">
              <Radio className="mt-0.5 h-5 w-5 shrink-0 text-white" />
              <div className="text-[14px]">
                <p className="font-semibold text-white">
                  Capa API Desacoplada (Axios + TanStack Query v5)
                </p>
                <p className="text-[12px] text-white/80">
                  Interceptores JWT listos para producción y manejo automático
                  de respuestas HTTP 401 y 403.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-[12px] border border-white/15 bg-[#0B533E]/60 p-4 backdrop-blur-sm">
              <Layers className="mt-0.5 h-5 w-5 shrink-0 text-white" />
              <div className="text-[14px]">
                <p className="font-semibold text-white">
                  Design System Oficial v1.0.0
                </p>
                <p className="text-[12px] text-white/80">
                  Tipografía Montserrat + JetBrains Mono y contraste accesible
                  WCAG AA.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-[12px] text-white/75">
          © {new Date().getFullYear()} Electrónica &amp; Más EIRL. Todos los
          derechos reservados.
        </p>
      </div>

      {/* Right Column: Login Card */}
      <div className="flex flex-col items-center justify-center bg-background p-6">
        <div className="mb-6 lg:hidden">
          <BrandLogo variant="horizontal" tone="light-bg" />
        </div>
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1.5">
            <CardTitle>Acceso a Consola Administrativa</CardTitle>
            <CardDescription>
              Ingresa tus credenciales corporativas o utiliza el acceso rápido
              para probar los 3 roles del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
