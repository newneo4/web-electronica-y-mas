import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  KeyRound,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { authService } from '@/features/auth/api/auth.service';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Role } from '@/features/auth/types/auth.types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El correo corporativo es obligatorio')
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface QuickLoginOption {
  role: Role;
  email: string;
  label: string;
  scopeDescription: string;
  isMobilePwa?: boolean;
}

const QUICK_LOGIN_ACCOUNTS: QuickLoginOption[] = [
  {
    role: 'ADMIN',
    email: 'admin@demo.com',
    label: 'Administrador General',
    scopeDescription:
      'Acceso total a los 8 módulos Web ERP, usuarios y configuración.',
  },
  {
    role: 'COORDINADOR',
    email: 'coordinador@demo.com',
    label: 'Coordinador de Despacho',
    scopeDescription:
      'Clientes, Técnicos, Planes Preventivos, Agenda Asistida y Monitoreo.',
  },
  {
    role: 'SUPERVISOR',
    email: 'supervisor@demo.com',
    label: 'Supervisor de Operaciones',
    scopeDescription:
      'Dashboard, Clientes, Monitoreo en Vivo, Cierre de Incidencias y Reportes.',
  },
  {
    role: 'TECNICO',
    email: 'tecnico@demo.com',
    label: 'Técnico de Campo (App Móvil PWA)',
    scopeDescription:
      'Entregable B: Mi Agenda móvil y flujo secuencial de 7 pasos en sede.',
    isMobilePwa: true,
  },
];

export function LoginForm() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@demo.com',
      password: 'password123',
    },
  });

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      setAuthError(null);
      const loggedUser = response.data.user;
      setSession(loggedUser, response.data.accessToken);

      // Redirección automática según rol (CA-04 y CA-08)
      if (loggedUser.role === 'TECNICO') {
        navigate('/field/agenda', { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    },
    onError: (error: Error) => {
      setAuthError(error.message);
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values);
  };

  const handleQuickLogin = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'password123', { shouldValidate: true });
    loginMutation.mutate({
      email,
      password: 'password123',
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {authError && (
          <div className="flex items-start gap-2 rounded-[8px] border border-[#A8262B]/40 bg-[#A8262B]/10 p-3 text-[12px] text-[#A8262B]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Correo Electrónico Corporativo</Label>
          <Input
            id="email"
            type="email"
            placeholder="nombre@electronicaymas.pe"
            autoComplete="email"
            disabled={loginMutation.isPending}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-[12px] text-[#A8262B]">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Contraseña</Label>
            <span className="text-[11px] text-[#78909C]">
              Demo: <code className="font-mono">password123</code>
            </span>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={loginMutation.isPending}
            {...register('password')}
          />
          {errors.password && (
            <p className="text-[12px] text-[#A8262B]">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          <KeyRound className="h-4 w-4" />
          {loginMutation.isPending
            ? 'Autenticando (400ms)...'
            : 'Ingresar'}
        </Button>
      </form>

      {/* Quick Login Section for Instant RBAC Testing */}
      <div className="space-y-3 rounded-[12px] border bg-background/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-[#0D6950]" />
            <span>Acceso Rápido Demo (Web ERP + PWA Móvil)</span>
          </div>
          <Badge variant="outline" className="text-[10px]">
            4 Roles MVP
          </Badge>
        </div>

        <div className="grid gap-2">
          {QUICK_LOGIN_ACCOUNTS.map((account) => (
            <button
              key={account.role}
              type="button"
              disabled={loginMutation.isPending}
              onClick={() => handleQuickLogin(account.email)}
              className="group flex w-full items-center justify-between rounded-[8px] border bg-card p-2.5 text-left transition-colors hover:border-[#0D6950] hover:bg-[#0D6950]/5 disabled:opacity-50"
            >
              <div className="space-y-0.5 pr-2">
                <div className="flex flex-wrap items-center gap-2">
                  {account.isMobilePwa ? (
                    <Smartphone className="h-3.5 w-3.5 text-[#A8262B]" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5 text-[#0D6950]" />
                  )}
                  <span className="text-[12px] font-semibold text-foreground">
                    {account.label}
                  </span>
                  <span className="font-mono text-[11px] text-[#78909C]">
                    ({account.email})
                  </span>
                </div>
                <p className="text-[11px] text-[#78909C]">
                  {account.scopeDescription}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[#78909C] transition-transform group-hover:translate-x-0.5 group-hover:text-[#0D6950]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
