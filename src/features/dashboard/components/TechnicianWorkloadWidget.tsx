import { Link } from 'react-router-dom';
import { MapPin, UserCheck, Wrench } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type {
  TechnicianLivePresence,
  TechnicianWorkloadItem,
} from '@/features/dashboard/types/dashboard.types';
import { getInitials } from '@/lib/utils';

interface TechnicianWorkloadWidgetProps {
  workloads?: TechnicianWorkloadItem[];
  isLoading: boolean;
}

const PRESENCE_BADGE: Record<
  TechnicianLivePresence,
  { label: string; variant: 'secondary' | 'warning' | 'success' }
> = {
  LIBRE: { label: 'Libre', variant: 'secondary' },
  EN_TRASLADO: { label: 'En traslado', variant: 'warning' },
  EN_SEDE: { label: 'En sede', variant: 'success' },
};

export function TechnicianWorkloadWidget({
  workloads = [],
  isLoading,
}: TechnicianWorkloadWidgetProps) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-[#0D6950]" />
            <span>Carga de Técnicos Hoy</span>
          </CardTitle>
          <CardDescription>
            Estado actual y visitas asignadas al personal activo.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading
          ? Array.from({ length: 3 }).map((_, idx) => (
              <Skeleton key={idx} className="h-24 w-full rounded-[8px]" />
            ))
          : workloads.map((tech) => {
              const badge = PRESENCE_BADGE[tech.presence];
              return (
                <div
                  key={tech.technicianId}
                  className="space-y-2.5 rounded-[12px] border p-3.5 transition-colors hover:border-[#0D6950]/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>
                          {getInitials(tech.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-[14px] font-semibold text-foreground">
                          {tech.fullName}
                        </p>
                        <p className="text-[11px] text-[#78909C]">
                          {tech.specialties.join(' • ')}
                        </p>
                      </div>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                  </div>

                  {tech.activeClientBranch && (
                    <div className="flex items-center gap-1.5 rounded-[6px] bg-[#0D6950]/5 px-2.5 py-1.5 text-[12px] text-[#0D6950]">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate font-medium">
                        {tech.activeClientBranch}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t pt-2 text-[12px] text-[#78909C]">
                    <span>
                      Zonas:{' '}
                      <strong className="text-foreground">
                        {tech.assignedZones.slice(0, 2).join(', ')}
                      </strong>
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {tech.todayCompletedCount}/{tech.todayAssignedCount}{' '}
                      visitas
                    </span>
                  </div>
                </div>
              );
            })}

        <Button variant="outline" size="sm" className="w-full" asChild>
          <Link to="/admin/technicians">
            <Wrench className="h-3.5 w-3.5" />
            <span>Administrar Plantilla de Técnicos</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
