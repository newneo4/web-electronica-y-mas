import { Layers, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { VisitStatusBadge } from '@/components/common/VisitStatusBadge';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { VisitStatus } from '@/types/field.types';

const ALL_STATUSES: VisitStatus[] = [
  'POR_PROGRAMAR',
  'PROGRAMADA',
  'EN_TRASLADO',
  'EN_CURSO',
  'PAUSADA',
  'COMPLETADA',
  'CON_PENDIENTES',
  'VENCIDA',
];

interface ModulePhasePreviewPageProps {
  title: string;
  phaseLabel: string;
  description: string;
  endpointPreview: string;
}

export function ModulePhasePreviewPage({
  title,
  phaseLabel,
  description,
  endpointPreview,
}: ModulePhasePreviewPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={<Badge variant="info">{phaseLabel}</Badge>}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-[#0D6950]">
            <Layers className="h-5 w-5" />
            <CardTitle>Ruta y Guard RBAC Configurados (Fase 1)</CardTitle>
          </div>
          <CardDescription>
            Esta ruta ya cuenta con protección por rol y contrato de datos en{' '}
            <code className="font-mono text-foreground">
              src/types/field.types.ts
            </code>
            . Se completará su interfaz funcional en la{' '}
            <strong>{phaseLabel}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-[8px] border bg-background p-3.5 text-[12px]">
            <p className="font-semibold text-foreground">
              Endpoint Backend Preparado:
            </p>
            <code className="mt-1 block font-mono text-[#0D6950]">
              {endpointPreview}
            </code>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-[#0D6950]" />
              <span>
                Máquina de Estados de Visita Lista (`VisitStatusBadge`):
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ALL_STATUSES.map((status) => (
                <VisitStatusBadge key={status} status={status} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
