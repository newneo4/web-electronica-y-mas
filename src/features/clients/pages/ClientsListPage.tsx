import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  FileSpreadsheet,
  MapPin,
  Plus,
  Search,
} from 'lucide-react';
import { clientsService } from '@/features/clients/api/clients.service';
import { ExcelImportWizardModal } from '@/features/clients/components/ExcelImportWizardModal';
import type {
  ExcelImportRow,
  ImportBatchResult,
} from '@/features/clients/types/client.types';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const newClientSchema = z.object({
  ruc: z
    .string()
    .regex(/^\d{11}$/, 'El RUC debe contener exactamente 11 dígitos numéricos'),
  businessName: z.string().min(3, 'Ingresa la razón social del cliente'),
  branchName: z.string().min(2, 'Ingresa el nombre de la sede principal'),
  branchAddress: z.string().min(5, 'Ingresa la dirección física de la sede'),
  branchZone: z.string().min(2, 'Especifica la zona geográfica'),
  contactName: z.string().min(3, 'Ingresa el nombre del contacto en sede'),
  contactPhone: z.string().min(6, 'Ingresa un teléfono de contacto válido'),
});

type NewClientFormValues = z.infer<typeof newClientSchema>;

export function ClientsListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [zoneFilter, setZoneFilter] = useState<string>('ALL');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [lastImportSummary, setLastImportSummary] =
    useState<ImportBatchResult | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsService.getClients,
  });

  const clients = data?.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewClientFormValues>({
    resolver: zodResolver(newClientSchema),
    defaultValues: {
      ruc: '',
      businessName: '',
      branchName: 'Sede Principal',
      branchAddress: '',
      branchZone: 'San Isidro',
      contactName: '',
      contactPhone: '',
    },
  });

  const createClientMutation = useMutation({
    mutationFn: clientsService.createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsCreateOpen(false);
      reset();
    },
  });

  const importBatchMutation = useMutation({
    mutationFn: (rows: ExcelImportRow[]) =>
      clientsService.importClientsBatch(rows),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setLastImportSummary(response.data);
      setIsImportOpen(false);
    },
  });

  const allZones = Array.from(
    new Set(
      clients.flatMap((client) => client.branches.map((branch) => branch.zone))
    )
  );

  const filteredClients = clients.filter((client) => {
    const matchesStatus =
      statusFilter === 'ALL' || client.status === statusFilter;
    const matchesZone =
      zoneFilter === 'ALL' ||
      client.branches.some((b) => b.zone === zoneFilter);
    const term = search.toLowerCase().trim();
    const matchesSearch =
      !term ||
      client.ruc.includes(term) ||
      client.businessName.toLowerCase().includes(term) ||
      client.branches.some((b) => b.name.toLowerCase().includes(term));

    return matchesStatus && matchesZone && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Padrón de Clientes y Sedes"
        description="Administra clientes corporativos, múltiples sedes operativas, contactos e importación masiva desde Excel."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportOpen(true)}
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Importar desde Excel</span>
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>Nuevo Cliente</span>
            </Button>
          </>
        }
      />

      {lastImportSummary && (
        <div className="flex items-center justify-between rounded-[8px] border border-[#0D6950]/40 bg-[#0D6950]/10 px-4 py-3 text-[12px] text-[#0D6950]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              <strong>Resultado de Importación (CA-01):</strong>{' '}
              {lastImportSummary.createdClientsCount} clientes nuevos,{' '}
              {lastImportSummary.addedBranchesCount} sedes agregadas,{' '}
              {lastImportSummary.updatedBranchesCount} sedes actualizadas y{' '}
              <strong>
                {lastImportSummary.skippedCount} duplicados omitidos
              </strong>
              .
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLastImportSummary(null)}
            className="text-[11px] font-semibold underline"
          >
            Cerrar aviso
          </button>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#78909C]" />
          <Input
            placeholder="Buscar por RUC, Razón Social o nombre de sede..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={zoneFilter} onValueChange={setZoneFilter}>
          <SelectTrigger className="w-full sm:w-[190px]">
            <SelectValue placeholder="Todas las zonas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todas las zonas</SelectItem>
            {allZones.map((zone) => (
              <SelectItem key={zone} value={zone}>
                {zone}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[170px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="ACTIVO">Activos</SelectItem>
            <SelectItem value="INACTIVO">Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de Clientes */}
      <div className="rounded-[12px] border bg-card shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RUC / Razón Social</TableHead>
              <TableHead>Sedes Registradas</TableHead>
              <TableHead>Contacto Principal</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Expediente</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <TableRow key={idx}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-12 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredClients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-6">
                  <EmptyState
                    icon={Building2}
                    title="No se encontraron clientes"
                    description="Intenta ajustar los filtros de zona/estado o registra un nuevo cliente."
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredClients.map((client) => {
                const primaryBranch = client.branches[0];
                return (
                  <TableRow key={client.id}>
                    <TableCell>
                      <p className="font-mono text-[12px] font-semibold text-[#0D6950]">
                        RUC {client.ruc}
                      </p>
                      <Link
                        to={`/admin/clients/${client.id}`}
                        className="text-[14px] font-semibold text-foreground hover:text-[#0D6950] hover:underline"
                      >
                        {client.businessName}
                      </Link>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="info">
                          {client.branches.length}{' '}
                          {client.branches.length === 1 ? 'sede' : 'sedes'}
                        </Badge>
                        <div className="flex flex-wrap gap-1 text-[11px] text-[#78909C]">
                          {client.branches.map((b) => (
                            <span
                              key={b.id}
                              className="inline-flex items-center gap-0.5"
                            >
                              <MapPin className="h-3 w-3 text-[#0D6950]" />
                              {b.zone}
                            </span>
                          ))}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {primaryBranch ? (
                        <div className="text-[12px]">
                          <p className="font-medium text-foreground">
                            {primaryBranch.contactName}
                          </p>
                          <p className="font-mono text-[11px] text-[#78909C]">
                            {primaryBranch.contactPhone}
                          </p>
                        </div>
                      ) : (
                        <span className="text-[12px] text-[#78909C]">—</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          client.status === 'ACTIVO' ? 'success' : 'secondary'
                        }
                      >
                        {client.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/clients/${client.id}`}>
                          <span>Sedes e Historial</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal: Nuevo Cliente */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Cliente y Sede Inicial</DialogTitle>
            <DialogDescription>
              Ingresa los datos fiscales y de la sede operativa principal.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((values) =>
              createClientMutation.mutate(values)
            )}
            className="space-y-4 pt-2"
            noValidate
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="cli-ruc">RUC (11 dígitos)</Label>
                <Input
                  id="cli-ruc"
                  placeholder="20548912301"
                  maxLength={11}
                  {...register('ruc')}
                />
                {errors.ruc && (
                  <p className="text-[12px] text-[#A8262B]">
                    {errors.ruc.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cli-name">Razón Social</Label>
                <Input
                  id="cli-name"
                  placeholder="Ej. Consorcio Electrónico del Sur S.A.C."
                  {...register('businessName')}
                />
                {errors.businessName && (
                  <p className="text-[12px] text-[#A8262B]">
                    {errors.businessName.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="br-name">Nombre de Sede Inicial</Label>
                <Input
                  id="br-name"
                  placeholder="Sede Central"
                  {...register('branchName')}
                />
                {errors.branchName && (
                  <p className="text-[12px] text-[#A8262B]">
                    {errors.branchName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="br-zone">Zona Geográfica</Label>
                <Input
                  id="br-zone"
                  placeholder="Ej. San Isidro, Callao, Ate"
                  {...register('branchZone')}
                />
                {errors.branchZone && (
                  <p className="text-[12px] text-[#A8262B]">
                    {errors.branchZone.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="br-address">Dirección Exacta de la Sede</Label>
              <Input
                id="br-address"
                placeholder="Av. Javier Prado Este 2410, San Borja"
                {...register('branchAddress')}
              />
              {errors.branchAddress && (
                <p className="text-[12px] text-[#A8262B]">
                  {errors.branchAddress.message}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="br-contact">Nombre del Contacto</Label>
                <Input
                  id="br-contact"
                  placeholder="Ing. Alberto Salas"
                  {...register('contactName')}
                />
                {errors.contactName && (
                  <p className="text-[12px] text-[#A8262B]">
                    {errors.contactName.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="br-phone">Teléfono de Contacto</Label>
                <Input
                  id="br-phone"
                  placeholder="+51 998 112 340"
                  {...register('contactPhone')}
                />
                {errors.contactPhone && (
                  <p className="text-[12px] text-[#A8262B]">
                    {errors.contactPhone.message}
                  </p>
                )}
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createClientMutation.isPending}>
                {createClientMutation.isPending
                  ? 'Guardando (400ms)...'
                  : 'Guardar Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Asistente de Importación Excel con Detector de Duplicados (CA-01) */}
      <ExcelImportWizardModal
        open={isImportOpen}
        onOpenChange={setIsImportOpen}
        existingClients={clients}
        isSubmitting={importBatchMutation.isPending}
        onConfirmImport={(rows) => importBatchMutation.mutate(rows)}
      />
    </div>
  );
}
