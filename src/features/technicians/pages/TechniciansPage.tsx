import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  Edit3,
  MapPin,
  Phone,
  Plus,
  Power,
  Wrench,
} from 'lucide-react';
import {
  techniciansService,
  type UpsertTechnicianPayload,
} from '@/features/technicians/api/technicians.service';
import type { Technician } from '@/types/field.types';
import { PageHeader } from '@/components/common/PageHeader';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, getInitials } from '@/lib/utils';

const technicianFormSchema = z.object({
  fullName: z.string().min(3, 'Ingresa el nombre completo del técnico'),
  email: z.string().email('Ingresa un correo corporativo válido'),
  phone: z.string().min(6, 'Ingresa un teléfono móvil válido'),
  specialtiesText: z
    .string()
    .min(2, 'Ingresa al menos una especialidad separada por comas'),
  zonesText: z
    .string()
    .min(2, 'Ingresa al menos una zona asignada separada por comas'),
  startTime: z.string().min(4, 'Hora de inicio requerida'),
  endTime: z.string().min(4, 'Hora de fin requerida'),
});

type TechnicianFormValues = z.infer<typeof technicianFormSchema>;

export function TechniciansPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTech, setEditingTech] = useState<Technician | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['technicians'],
    queryFn: techniciansService.getTechnicians,
  });

  const technicians = data?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TechnicianFormValues>({
    resolver: zodResolver(technicianFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      specialtiesText: 'UPS Industrial, Redes',
      zonesText: 'San Isidro, Miraflores',
      startTime: '08:00',
      endTime: '18:00',
    },
  });

  const upsertMutation = useMutation({
    mutationFn: (payload: UpsertTechnicianPayload) =>
      techniciansService.upsertTechnician(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-daily-overview'] });
      setIsModalOpen(false);
      setEditingTech(null);
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id: string) => techniciansService.toggleTechnicianStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['technicians'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-daily-overview'] });
    },
  });

  const handleOpenCreate = () => {
    setEditingTech(null);
    reset({
      fullName: '',
      email: '',
      phone: '+51 980 000 000',
      specialtiesText: 'UPS Industrial, Redes, CCTV',
      zonesText: 'San Isidro, Miraflores',
      startTime: '08:00',
      endTime: '18:00',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (tech: Technician) => {
    setEditingTech(tech);
    reset({
      fullName: tech.fullName,
      email: tech.email,
      phone: tech.phone,
      specialtiesText: tech.specialties.join(', '),
      zonesText: tech.assignedZones.join(', '),
      startTime: tech.workSchedule.startTime,
      endTime: tech.workSchedule.endTime,
    });
    setIsModalOpen(true);
  };

  const onSubmit = (values: TechnicianFormValues) => {
    upsertMutation.mutate({
      id: editingTech?.id,
      fullName: values.fullName,
      email: values.email,
      phone: values.phone,
      specialties: values.specialtiesText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      assignedZones: values.zonesText
        .split(',')
        .map((z) => z.trim())
        .filter(Boolean),
      startTime: values.startTime,
      endTime: values.endTime,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plantilla de Técnicos de Campo"
        description="Gestiona especialidades técnicas, cobertura por zonas, horarios de jornada y acceso a la App Móvil PWA."
        actions={
          <Button size="sm" onClick={handleOpenCreate}>
            <Plus className="h-4 w-4" />
            <span>Nuevo Técnico</span>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-48 w-full rounded-[12px]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {technicians.map((tech) => (
            <Card
              key={tech.id}
              className={cn(
                'transition-colors',
                !tech.isActive && 'opacity-70 bg-muted/30'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11">
                      <AvatarFallback>
                        {getInitials(tech.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-[18px]">
                        {tech.fullName}
                      </CardTitle>
                      <CardDescription className="text-[12px]">
                        {tech.email}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant={tech.isActive ? 'success' : 'secondary'}>
                    {tech.isActive ? 'ACTIVO EN CAMPO' : 'INACTIVO'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 border-t pt-3 text-[12px]">
                {/* Especialidades */}
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#78909C]">
                    <Wrench className="h-3.5 w-3.5 text-[#0D6950]" />
                    Especialidades Homologadas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tech.specialties.map((spec) => (
                      <Badge key={spec} variant="info">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Zonas asignadas */}
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 font-semibold text-[#78909C]">
                    <MapPin className="h-3.5 w-3.5 text-[#0D6950]" />
                    Zonas de Cobertura:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tech.assignedZones.map((zone) => (
                      <Badge key={zone} variant="secondary">
                        {zone}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Jornada y Teléfono */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
                  <div className="flex items-center gap-4 text-[#78909C]">
                    <span className="inline-flex items-center gap-1 font-mono text-foreground">
                      <Clock className="h-3.5 w-3.5 text-[#0D6950]" />
                      {tech.workSchedule.startTime} -{' '}
                      {tech.workSchedule.endTime}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono">
                      <Phone className="h-3.5 w-3.5 text-[#0D6950]" />
                      {tech.phone}
                    </span>
                  </div>

                  {/* Acciones: Editar + StatusToggleSwitch */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(tech)}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Editar</span>
                    </Button>
                    <Button
                      variant={tech.isActive ? 'outline' : 'default'}
                      size="sm"
                      disabled={toggleStatusMutation.isPending}
                      onClick={() => toggleStatusMutation.mutate(tech.id)}
                      title="Activar/Desactivar acceso sin borrar su historial de visitas"
                    >
                      <Power className="h-3.5 w-3.5" />
                      <span>
                        {tech.isActive ? 'Desactivar' : 'Reactivar'}
                      </span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Upsert Técnico */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {editingTech
                ? `Editar Técnico: ${editingTech.fullName}`
                : 'Registrar Nuevo Técnico de Campo'}
            </DialogTitle>
            <DialogDescription>
              Configura especialidades y zonas utilizadas por el motor de
              asignación asistida en Agenda.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 pt-2"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="tech-name">Nombre Completo</Label>
              <Input id="tech-name" {...register('fullName')} />
              {errors.fullName && (
                <p className="text-[12px] text-[#A8262B]">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tech-email">Correo (Acceso PWA)</Label>
                <Input id="tech-email" type="email" {...register('email')} />
                {errors.email && (
                  <p className="text-[12px] text-[#A8262B]">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tech-phone">Teléfono Móvil</Label>
                <Input id="tech-phone" {...register('phone')} />
                {errors.phone && (
                  <p className="text-[12px] text-[#A8262B]">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tech-specs">
                Especialidades (separadas por comas)
              </Label>
              <Input
                id="tech-specs"
                placeholder="UPS Industrial, Redes, CCTV, Servidores"
                {...register('specialtiesText')}
              />
              {errors.specialtiesText && (
                <p className="text-[12px] text-[#A8262B]">
                  {errors.specialtiesText.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tech-zones">
                Zonas Asignadas (separadas por comas)
              </Label>
              <Input
                id="tech-zones"
                placeholder="San Isidro, Miraflores, Callao, Ate Industrial"
                {...register('zonesText')}
              />
              {errors.zonesText && (
                <p className="text-[12px] text-[#A8262B]">
                  {errors.zonesText.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tech-start">Inicio de Jornada</Label>
                <Input
                  id="tech-start"
                  type="time"
                  className="font-mono"
                  {...register('startTime')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tech-end">Fin de Jornada</Label>
                <Input
                  id="tech-end"
                  type="time"
                  className="font-mono"
                  {...register('endTime')}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending
                  ? 'Guardando (400ms)...'
                  : 'Guardar Técnico'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
