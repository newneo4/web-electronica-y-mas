import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  ClipboardList,
  Clock,
  History,
  MapPin,
  Phone,
  Plus,
  User,
} from 'lucide-react';
import { clientsService } from '@/features/clients/api/clients.service';
import { PageHeader } from '@/components/common/PageHeader';
import { VisitStatusBadge } from '@/components/common/VisitStatusBadge';
import { EmptyState } from '@/components/common/EmptyState';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const branchSchema = z.object({
  name: z.string().min(2, 'El nombre de la sede es obligatorio'),
  address: z.string().min(5, 'La dirección física es obligatoria'),
  zone: z.string().min(2, 'La zona es obligatoria'),
  contactName: z.string().min(3, 'El nombre del contacto es obligatorio'),
  contactPhone: z.string().min(6, 'El teléfono es obligatorio'),
  contactEmail: z.string().optional(),
});

type BranchFormValues = z.infer<typeof branchSchema>;

export function ClientProfilePage() {
  const { clientId = '' } = useParams<{ clientId: string }>();
  const queryClient = useQueryClient();
  const [isAddBranchOpen, setIsAddBranchOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['client-detail', clientId],
    queryFn: () => clientsService.getClientDetail(clientId),
    enabled: Boolean(clientId),
  });

  const detail = data?.data;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: {
      name: '',
      address: '',
      zone: 'San Isidro',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
    },
  });

  const addBranchMutation = useMutation({
    mutationFn: (payload: BranchFormValues) =>
      clientsService.addBranch(clientId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-detail', clientId] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsAddBranchOpen(false);
      reset();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!detail) {
    return (
      <EmptyState
        title="Cliente no encontrado"
        description="El identificador solicitado no existe en el padrón."
        action={
          <Button asChild size="sm">
            <Link to="/admin/clients">Volver al listado</Link>
          </Button>
        }
      />
    );
  }

  const { client, servicePlans, visitsHistory } = detail;

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.businessName}
        description={`RUC ${client.ruc} • ${client.branches.length} sedes operativas registradas`}
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/clients">
                <ArrowLeft className="h-4 w-4" />
                <span>Volver a Clientes</span>
              </Link>
            </Button>
            <Button size="sm" onClick={() => setIsAddBranchOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Nueva Sede</span>
            </Button>
          </>
        }
      />

      <Tabs defaultValue="branches" className="space-y-4">
        <TabsList>
          <TabsTrigger value="branches" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span>Sedes ({client.branches.length})</span>
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            <span>Planes Preventivos ({servicePlans.length})</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            <span>Historial de Visitas ({visitsHistory.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* PESTAÑA 1: SEDES */}
        <TabsContent value="branches">
          <div className="grid gap-4 md:grid-cols-2">
            {client.branches.map((branch) => (
              <Card key={branch.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-[18px]">
                        {branch.name}
                      </CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#0D6950]" />
                        <span>{branch.address}</span>
                      </CardDescription>
                    </div>
                    <Badge variant="info">{branch.zone}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 border-t pt-3 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[#78909C]">
                      <User className="h-3.5 w-3.5" />
                      Contacto Responsable:
                    </span>
                    <span className="font-semibold text-foreground">
                      {branch.contactName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[#78909C]">
                      <Phone className="h-3.5 w-3.5" />
                      Teléfono Directo:
                    </span>
                    <span className="font-mono font-semibold text-[#0D6950]">
                      {branch.contactPhone}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* PESTAÑA 2: PLANES PREVENTIVOS */}
        <TabsContent value="plans">
          {servicePlans.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Sin planes preventivos asociados"
              description="Configura un plan preventivo recurrente desde el módulo Planes Preventivos."
              action={
                <Button size="sm" asChild>
                  <Link to="/admin/service-plans">Ir a Planes Preventivos</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4">
              {servicePlans.map((plan) => {
                const branch = client.branches.find(
                  (b) => b.id === plan.branchId
                );
                return (
                  <Card key={plan.id}>
                    <CardHeader>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <CardTitle className="text-[18px]">
                            {plan.title}
                          </CardTitle>
                          <CardDescription>
                            Sede: {branch?.name ?? 'Sede'} • Especialidad:{' '}
                            <strong>{plan.requiredSpecialty}</strong>
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">{plan.frequency}</Badge>
                          <Badge variant="outline" className="font-mono">
                            {plan.estimatedDurationMinutes} min
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2 text-[12px] font-semibold text-[#78909C]">
                        Checklist de Verificación ({plan.checklistTemplate.length}{' '}
                        tareas):
                      </p>
                      <ul className="space-y-1.5 text-[12px]">
                        {plan.checklistTemplate.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center justify-between rounded-[6px] border bg-background px-3 py-1.5"
                          >
                            <span>{item.label}</span>
                            <Badge
                              variant={
                                item.isRequired ? 'info' : 'secondary'
                              }
                            >
                              {item.isRequired ? 'Obligatorio' : 'Opcional'}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* PESTAÑA 3: HISTORIAL DE SERVICIOS (CA-07) */}
        <TabsContent value="history">
          {visitsHistory.length === 0 ? (
            <EmptyState
              icon={History}
              title="Sin historial de visitas"
              description="Aún no se han registrado visitas para este cliente."
            />
          ) : (
            <div className="space-y-4">
              {visitsHistory.map((visit) => {
                const exec = visit.execution;
                const effectiveMin = exec
                  ? Math.round(exec.effectiveWorkSeconds / 60)
                  : 0;
                return (
                  <Card key={visit.id}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[12px] font-bold text-[#0D6950]">
                              {visit.code}
                            </span>
                            <span className="font-mono text-[12px] text-[#78909C]">
                              • {visit.scheduledDate}{' '}
                              {visit.scheduledStartTime ?? ''}
                            </span>
                          </div>
                          <CardTitle className="mt-1 text-[18px]">
                            {visit.title}
                          </CardTitle>
                          <CardDescription>
                            Sede: {visit.branchName} ({visit.branchZone}) •
                            Técnico:{' '}
                            <strong>
                              {visit.technicianName ?? 'Por asignar'}
                            </strong>
                          </CardDescription>
                        </div>
                        <VisitStatusBadge status={visit.status} />
                      </div>
                    </CardHeader>

                    {exec && (
                      <CardContent className="space-y-3 border-t pt-3 text-[12px]">
                        <div className="flex flex-wrap items-center gap-4 text-[#78909C]">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-[#0D6950]" />
                            Tiempo Efectivo:{' '}
                            <strong className="font-mono text-foreground">
                              {effectiveMin} min
                            </strong>{' '}
                            (Estimado: {visit.estimatedDurationMinutes} min)
                          </span>
                          {exec.signOff && (
                            <span>
                              Conformidad firmada por:{' '}
                              <strong className="text-foreground">
                                {exec.signOff.receiverName}
                              </strong>
                            </span>
                          )}
                        </div>

                        {exec.diagnostics && (
                          <div className="grid gap-3 rounded-[8px] border bg-background p-3 sm:grid-cols-2">
                            <div>
                              <p className="font-semibold text-foreground">
                                Diagnóstico Técnico:
                              </p>
                              <p className="mt-0.5 text-[#78909C]">
                                {exec.diagnostics}
                              </p>
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                Solución Aplicada:
                              </p>
                              <p className="mt-0.5 text-[#78909C]">
                                {exec.solutionApplied}
                              </p>
                            </div>
                          </div>
                        )}

                        {exec.hasPendingIssues && (
                          <div className="flex items-start gap-2 rounded-[8px] border border-[#A8262B]/40 bg-[#A8262B]/10 p-3 text-[#A8262B]">
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <div>
                              <p className="font-semibold">
                                Pendiente Técnico Reportado en Campo:
                              </p>
                              <p>{exec.pendingIssuesDescription}</p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal: Agregar Sede */}
      <Dialog open={isAddBranchOpen} onOpenChange={setIsAddBranchOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Anexar Nueva Sede a {client.businessName}</DialogTitle>
            <DialogDescription>
              Registra una ubicación adicional y su responsable en sitio.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((values) => addBranchMutation.mutate(values))}
            className="space-y-4 pt-2"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-br-name">Nombre de la Sede</Label>
                <Input
                  id="new-br-name"
                  placeholder="Ej. Almacén Logístico Lurín"
                  {...register('name')}
                />
                {errors.name && (
                  <p className="text-[12px] text-[#A8262B]">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-br-zone">Zona</Label>
                <Input
                  id="new-br-zone"
                  placeholder="Ej. Surco, Callao, Ate"
                  {...register('zone')}
                />
                {errors.zone && (
                  <p className="text-[12px] text-[#A8262B]">
                    {errors.zone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new-br-addr">Dirección Exacta</Label>
              <Input
                id="new-br-addr"
                placeholder="Av. Industrial 1290"
                {...register('address')}
              />
              {errors.address && (
                <p className="text-[12px] text-[#A8262B]">
                  {errors.address.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-br-contact">Contacto en Sede</Label>
                <Input
                  id="new-br-contact"
                  placeholder="Ing. Raúl Medina"
                  {...register('contactName')}
                />
                {errors.contactName && (
                  <p className="text-[12px] text-[#A8262B]">
                    {errors.contactName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-br-phone">Teléfono</Label>
                <Input
                  id="new-br-phone"
                  placeholder="+51 991 220 410"
                  {...register('contactPhone')}
                />
                {errors.contactPhone && (
                  <p className="text-[12px] text-[#A8262B]">
                    {errors.contactPhone.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddBranchOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={addBranchMutation.isPending}>
                {addBranchMutation.isPending
                  ? 'Guardando (400ms)...'
                  : 'Guardar Sede'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
