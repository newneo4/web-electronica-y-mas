import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  CheckSquare,
  ClipboardList,
  Clock,
  MapPin,
  Plus,
} from 'lucide-react';
import { clientsService } from '@/features/clients/api/clients.service';
import {
  servicePlansService,
  type CreateServicePlanPayload,
} from '@/features/service-plans/api/service-plans.service';
import { ChecklistBuilder } from '@/features/service-plans/components/ChecklistBuilder';
import { getTodayIsoDate } from '@/lib/field-mock-db';
import type {
  ChecklistItemTemplate,
  FrequencyType,
} from '@/types/field.types';
import { PageHeader } from '@/components/common/PageHeader';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const DEFAULT_CHECKLIST: ChecklistItemTemplate[] = [
  {
    id: 'chk-def-1',
    label: 'Inspección visual de gabinete y medición de parámetros eléctricos',
    isRequired: true,
  },
  {
    id: 'chk-def-2',
    label: 'Limpieza técnica de tarjetas electrónicas y conectores',
    isRequired: true,
  },
  {
    id: 'chk-def-3',
    label: 'Prueba funcional de alarmas y registro fotográfico de estado final',
    isRequired: true,
  },
];

export function ServicePlansPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: plansData, isLoading } = useQuery({
    queryKey: ['service-plans'],
    queryFn: servicePlansService.getServicePlans,
  });

  const { data: clientsData } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsService.getClients,
  });

  const plans = plansData?.data ?? [];
  const clients = clientsData?.data ?? [];

  const [selectedClientId, setSelectedClientId] = useState<string>('cli-01');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('br-01');
  const [title, setTitle] = useState('');
  const [requiredSpecialty, setRequiredSpecialty] =
    useState('UPS Industrial');
  const [frequency, setFrequency] = useState<FrequencyType>('MENSUAL');
  const [startDate, setStartDate] = useState(getTodayIsoDate());
  const [durationMinutes, setDurationMinutes] = useState('90');
  const [checklistItems, setChecklistItems] =
    useState<ChecklistItemTemplate[]>(DEFAULT_CHECKLIST);

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const availableBranches = selectedClient?.branches ?? [];

  const createPlanMutation = useMutation({
    mutationFn: (payload: CreateServicePlanPayload) =>
      servicePlansService.createServicePlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-plans'] });
      setIsModalOpen(false);
      setTitle('');
    },
  });

  const handleClientChange = (nextClientId: string) => {
    setSelectedClientId(nextClientId);
    const cli = clients.find((c) => c.id === nextClientId);
    if (cli?.branches[0]) {
      setSelectedBranchId(cli.branches[0].id);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || checklistItems.length === 0) return;

    createPlanMutation.mutate({
      clientId: selectedClientId,
      branchId: selectedBranchId,
      title: title.trim(),
      requiredSpecialty,
      frequency,
      startDate,
      estimatedDurationMinutes: Number(durationMinutes) || 90,
      checklistTemplate: checklistItems,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planes de Servicio Preventivo"
        description="Configura contratos recurrentes por cliente y sede con sus plantillas de checklist para campo."
        actions={
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            <span>Nuevo Plan Preventivo</span>
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} className="h-44 w-full rounded-[12px]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {plans.map((plan) => (
            <Card key={plan.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default">{plan.frequency}</Badge>
                      <Badge variant="info">{plan.requiredSpecialty}</Badge>
                      <span className="inline-flex items-center gap-1 font-mono text-[12px] text-[#78909C]">
                        <Clock className="h-3.5 w-3.5 text-[#0D6950]" />
                        {plan.estimatedDurationMinutes} min estimados
                      </span>
                    </div>
                    <CardTitle className="mt-2 text-[20px]">
                      {plan.title}
                    </CardTitle>
                    <CardDescription className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground">
                        {plan.clientName}
                      </span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#0D6950]" />
                        {plan.branchName} ({plan.branchZone})
                      </span>
                    </CardDescription>
                  </div>

                  <div className="text-right font-mono text-[12px] text-[#78909C]">
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-3.5 w-3.5 text-[#0D6950]" />
                      Vigencia desde: {plan.startDate}
                    </span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="border-t pt-3">
                <p className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#78909C]">
                  <ClipboardList className="h-4 w-4 text-[#0D6950]" />
                  <span>
                    Plantilla de Tareas para App Móvil PWA (
                    {plan.checklistTemplate.length} ítems):
                  </span>
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {plan.checklistTemplate.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-2 rounded-[8px] border bg-background px-3 py-2 text-[12px]"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <CheckSquare className="h-3.5 w-3.5 shrink-0 text-[#0D6950]" />
                        <span className="truncate">
                          {index + 1}. {item.label}
                        </span>
                      </span>
                      <Badge
                        variant={item.isRequired ? 'info' : 'secondary'}
                        className="shrink-0 text-[10px]"
                      >
                        {item.isRequired ? 'Req.' : 'Opc.'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal: Crear Nuevo Plan con ChecklistBuilder */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Configurar Nuevo Plan de Servicio Preventivo</DialogTitle>
            <DialogDescription>
              Define la frecuencia de recurrencia y construye el checklist que
              se inyectará al generar las visitas del periodo.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Cliente</Label>
                <Select
                  value={selectedClientId}
                  onValueChange={handleClientChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((cli) => (
                      <SelectItem key={cli.id} value={cli.id}>
                        {cli.businessName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Sede Operativa</Label>
                <Select
                  value={selectedBranchId}
                  onValueChange={setSelectedBranchId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBranches.map((br) => (
                      <SelectItem key={br.id} value={br.id}>
                        {br.name} ({br.zone})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="plan-title">Título del Plan Preventivo</Label>
              <Input
                id="plan-title"
                required
                placeholder="Ej. Mantenimiento Preventivo de Rectificadores y Banco DC"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label>Especialidad</Label>
                <Select
                  value={requiredSpecialty}
                  onValueChange={setRequiredSpecialty}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPS Industrial">UPS Industrial</SelectItem>
                    <SelectItem value="Redes">Redes</SelectItem>
                    <SelectItem value="CCTV">CCTV</SelectItem>
                    <SelectItem value="Servidores">Servidores</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Frecuencia</Label>
                <Select
                  value={frequency}
                  onValueChange={(val) => setFrequency(val as FrequencyType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEMANAL">SEMANAL</SelectItem>
                    <SelectItem value="QUINCENAL">QUINCENAL</SelectItem>
                    <SelectItem value="MENSUAL">MENSUAL</SelectItem>
                    <SelectItem value="PERSONALIZADA">PERSONALIZADA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-date">Fecha Inicio</Label>
                <Input
                  id="plan-date"
                  type="date"
                  className="font-mono"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="plan-dur">Duración (min)</Label>
                <Input
                  id="plan-dur"
                  type="number"
                  min={30}
                  step={15}
                  className="font-mono"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                />
              </div>
            </div>

            <ChecklistBuilder
              items={checklistItems}
              onChange={setChecklistItems}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  createPlanMutation.isPending ||
                  !title.trim() ||
                  checklistItems.length === 0
                }
              >
                {createPlanMutation.isPending
                  ? 'Guardando (400ms)...'
                  : 'Crear Plan Preventivo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
