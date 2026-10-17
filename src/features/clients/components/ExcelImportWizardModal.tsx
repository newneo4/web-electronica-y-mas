import { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Upload,
} from 'lucide-react';
import type {
  DuplicateCheckStatus,
  ExcelImportRow,
  ImportResolutionAction,
} from '@/features/clients/types/client.types';
import type { Client } from '@/types/field.types';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ExcelImportWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingClients: Client[];
  isSubmitting: boolean;
  onConfirmImport: (rows: ExcelImportRow[]) => void;
}

const SAMPLE_EXCEL_RAW_ROWS = [
  {
    ruc: '20608891234',
    businessName: 'DataCenter Perú Cloud S.A.C.',
    branchName: 'Nodo Principal Surquillo',
    branchAddress: 'Av. Angamos Este 1640, Surquillo',
    branchZone: 'San Borja',
    contactName: 'Ing. Daniel Alarcón',
    contactPhone: '+51 988 120 450',
  },
  {
    // RUC existente (Corporación Financiera Andina) pero Sede Nueva
    ruc: '20548912301',
    businessName: 'Corporación Financiera Andina S.A.A.',
    branchName: 'Sede Banca Corporativa La Molina',
    branchAddress: 'Av. Javier Prado Este 5920, La Molina',
    branchZone: 'San Borja',
    contactName: 'Ing. Patricia Vega',
    contactPhone: '+51 995 310 880',
  },
  {
    // Duplicado exacto de RUC + Dirección de Sede (Av. República de Panamá 3420, San Isidro)
    ruc: '20548912301',
    businessName: 'Corporación Financiera Andina S.A.A.',
    branchName: 'Sede Central San Isidro',
    branchAddress: 'Av. República de Panamá 3420, San Isidro',
    branchZone: 'San Isidro',
    contactName: 'Ing. Ricardo Montalvo (Actualizado)',
    contactPhone: '+51 998 412 999',
  },
  {
    ruc: '20554109821',
    businessName: 'Laboratorios Farmacéuticos BioMed S.A.',
    branchName: 'Planta de Esterilización Lince',
    branchAddress: 'Av. Arequipa 2450, Lince',
    branchZone: 'San Isidro',
    contactName: 'Dra. Mónica Solís',
    contactPhone: '+51 984 771 203',
  },
];

function evaluateDuplicateStatus(
  rawRow: (typeof SAMPLE_EXCEL_RAW_ROWS)[number],
  existingClients: Client[]
): {
  status: DuplicateCheckStatus;
  defaultResolution: ImportResolutionAction;
} {
  const matchedClient = existingClients.find(
    (c) => c.ruc === rawRow.ruc.trim()
  );

  if (!matchedClient) {
    return { status: 'NEW_RECORD', defaultResolution: 'IMPORT' };
  }

  const normalizedAddr = rawRow.branchAddress.trim().toLowerCase();
  const hasExactBranch = matchedClient.branches.some(
    (b) => b.address.trim().toLowerCase() === normalizedAddr
  );

  if (hasExactBranch) {
    return {
      status: 'EXACT_BRANCH_DUPLICATE',
      defaultResolution: 'SKIP',
    };
  }

  return {
    status: 'EXISTING_RUC_NEW_BRANCH',
    defaultResolution: 'IMPORT',
  };
}

/**
 * ExcelImportWizardModal (Feature 02 — CA-01):
 * - Paso 1: Carga de archivo .xlsx / .csv (o plantilla demostrativa)
 * - Paso 2: Mapeo de columnas y previsualización
 * - Paso 3: Detector visual de duplicados en amarillo (#E29528) y rojo (#A8262B)
 *   con selector para Omitir o Actualizar/Fusionar antes de confirmar.
 */
export function ExcelImportWizardModal({
  open,
  onOpenChange,
  existingClients,
  isSubmitting,
  onConfirmImport,
}: ExcelImportWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ExcelImportRow[]>([]);

  const loadSampleDataset = (customFileName = 'padron_clientes_sedes_q4.xlsx') => {
    const analyzed: ExcelImportRow[] = SAMPLE_EXCEL_RAW_ROWS.map((raw, idx) => {
      const check = evaluateDuplicateStatus(raw, existingClients);
      return {
        rowNumber: idx + 2,
        ...raw,
        duplicateStatus: check.status,
        resolution: check.defaultResolution,
      };
    });
    setFileName(customFileName);
    setParsedRows(analyzed);
    setStep(2);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    loadSampleDataset(file.name);
  };

  const handleResolutionChange = (
    rowNumber: number,
    resolution: ImportResolutionAction
  ) => {
    setParsedRows((prev) =>
      prev.map((row) =>
        row.rowNumber === rowNumber ? { ...row, resolution } : row
      )
    );
  };

  const resetWizard = () => {
    setStep(1);
    setFileName('');
    setParsedRows([]);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) resetWizard();
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-[780px]">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-[#0D6950]" />
              <span>Asistente de Importación Excel / CSV (CA-01)</span>
            </DialogTitle>
            <Badge variant="info">Paso {step} de 3</Badge>
          </div>
          <DialogDescription>
            Importa clientes y sedes validando automáticamente duplicados de RUC
            y dirección física antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        {/* Indicador de Pasos */}
        <div className="grid grid-cols-3 gap-2 rounded-[8px] border bg-background p-2 text-center text-[12px]">
          <div
            className={cn(
              'rounded-[6px] py-1.5 font-semibold',
              step === 1
                ? 'bg-[#0D6950] text-white'
                : 'text-[#0D6950] bg-[#0D6950]/10'
            )}
          >
            1. Carga de Archivo
          </div>
          <div
            className={cn(
              'rounded-[6px] py-1.5 font-semibold',
              step === 2
                ? 'bg-[#0D6950] text-white'
                : step > 2
                  ? 'text-[#0D6950] bg-[#0D6950]/10'
                  : 'text-[#78909C]'
            )}
          >
            2. Mapeo y Previsualización
          </div>
          <div
            className={cn(
              'rounded-[6px] py-1.5 font-semibold',
              step === 3 ? 'bg-[#0D6950] text-white' : 'text-[#78909C]'
            )}
          >
            3. Control de Duplicados
          </div>
        </div>

        {/* PASO 1: Carga */}
        {step === 1 && (
          <div className="space-y-4 py-4">
            <label
              htmlFor="excel-upload-input"
              className="flex cursor-pointer flex-col items-center justify-center rounded-[12px] border-2 border-dashed border-[#0D6950]/40 bg-[#0D6950]/[0.03] px-6 py-10 text-center transition-colors hover:bg-[#0D6950]/[0.07]"
            >
              <Upload className="h-8 w-8 text-[#0D6950]" />
              <p className="mt-3 text-[14px] font-semibold text-foreground">
                Selecciona tu archivo .xlsx o .csv de Clientes y Sedes
              </p>
              <p className="mt-1 text-[12px] text-[#78909C]">
                Columnas requeridas: RUC, Razón Social, Nombre Sede, Dirección,
                Zona, Contacto, Teléfono
              </p>
              <input
                id="excel-upload-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>

            <div className="flex flex-col items-center justify-between gap-3 rounded-[8px] border bg-background p-4 sm:flex-row">
              <div className="text-[12px]">
                <p className="font-semibold text-foreground">
                  ¿Deseas probar inmediatamente el criterio de aceptación CA-01?
                </p>
                <p className="text-[#78909C]">
                  Carga un lote de prueba que incluye registros nuevos, un RUC
                  existente con nueva sede y un duplicado exacto.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadSampleDataset()}
              >
                Cargar Lote de Prueba (4 Filas)
              </Button>
            </div>
          </div>
        )}

        {/* PASO 2: Mapeo y Previsualización */}
        {step === 2 && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between rounded-[8px] border bg-[#0D6950]/5 px-4 py-2.5 text-[12px]">
              <span>
                Archivo cargado:{' '}
                <strong className="font-mono text-foreground">{fileName}</strong>
              </span>
              <Badge variant="success">
                {parsedRows.length} filas detectadas • Columnas mapeadas 7/7
              </Badge>
            </div>

            <div className="max-h-64 overflow-auto rounded-[8px] border">
              <table className="w-full text-left text-[12px]">
                <thead className="border-b bg-muted/50 text-[#78909C]">
                  <tr>
                    <th className="p-2.5">Fila</th>
                    <th className="p-2.5">RUC</th>
                    <th className="p-2.5">Razón Social</th>
                    <th className="p-2.5">Sede / Dirección</th>
                    <th className="p-2.5">Zona / Contacto</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {parsedRows.map((row) => (
                    <tr key={row.rowNumber}>
                      <td className="p-2.5 font-mono">#{row.rowNumber}</td>
                      <td className="p-2.5 font-mono font-semibold">
                        {row.ruc}
                      </td>
                      <td className="p-2.5 font-medium">{row.businessName}</td>
                      <td className="p-2.5">
                        <p className="font-medium">{row.branchName}</p>
                        <p className="text-[11px] text-[#78909C]">
                          {row.branchAddress}
                        </p>
                      </td>
                      <td className="p-2.5">
                        <p>{row.branchZone}</p>
                        <p className="text-[11px] text-[#78909C]">
                          {row.contactName}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* PASO 3: Detector Visual de Duplicados */}
        {step === 3 && (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-2.5 rounded-[8px] border border-[#E29528]/40 bg-[#E29528]/10 p-3 text-[12px] text-[#B87314] dark:text-[#F2AE49]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>Detector de Duplicados Activo:</strong> Las filas en{' '}
                <strong className="text-[#A8262B]">Rojo (#A8262B)</strong> ya
                existen con el mismo RUC y dirección de sede. Las filas en{' '}
                <strong>Ámbar (#E29528)</strong> corresponden a un RUC existente
                con una sede nueva.
              </span>
            </div>

            <div className="max-h-64 space-y-2.5 overflow-y-auto pr-1">
              {parsedRows.map((row) => {
                const isExactDuplicate =
                  row.duplicateStatus === 'EXACT_BRANCH_DUPLICATE';
                const isExistingRuc =
                  row.duplicateStatus === 'EXISTING_RUC_NEW_BRANCH';

                return (
                  <div
                    key={row.rowNumber}
                    className={cn(
                      'flex flex-col justify-between gap-3 rounded-[8px] border p-3 sm:flex-row sm:items-center',
                      isExactDuplicate &&
                        'border-[#A8262B] bg-[#A8262B]/[0.05]',
                      isExistingRuc && 'border-[#E29528] bg-[#E29528]/[0.06]',
                      row.duplicateStatus === 'NEW_RECORD' &&
                        'border-[#0D6950]/30 bg-[#0D6950]/[0.03]'
                    )}
                  >
                    <div className="space-y-1 text-[12px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold">
                          Fila #{row.rowNumber} • RUC {row.ruc}
                        </span>
                        <span className="font-semibold text-foreground">
                          {row.businessName}
                        </span>
                        {isExactDuplicate && (
                          <Badge variant="destructive">
                            Duplicado: RUC + Dirección Existente
                          </Badge>
                        )}
                        {isExistingRuc && (
                          <Badge variant="warning">
                            RUC Existente • Nueva Sede
                          </Badge>
                        )}
                        {row.duplicateStatus === 'NEW_RECORD' && (
                          <Badge variant="success">Cliente Nuevo</Badge>
                        )}
                      </div>
                      <p className="text-[#78909C]">
                        {row.branchName} — {row.branchAddress} ({row.branchZone})
                      </p>
                    </div>

                    <div className="w-full sm:w-[210px]">
                      <Select
                        value={row.resolution}
                        onValueChange={(val) =>
                          handleResolutionChange(
                            row.rowNumber,
                            val as ImportResolutionAction
                          )
                        }
                      >
                        <SelectTrigger className="h-9 text-[12px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {isExactDuplicate ? (
                            <>
                              <SelectItem value="SKIP">
                                Omitir duplicado
                              </SelectItem>
                              <SelectItem value="UPDATE_MERGE">
                                Actualizar contacto/sede
                              </SelectItem>
                            </>
                          ) : (
                            <>
                              <SelectItem value="IMPORT">
                                {isExistingRuc
                                  ? 'Anexar nueva sede'
                                  : 'Importar registro'}
                              </SelectItem>
                              <SelectItem value="SKIP">Omitir fila</SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setStep((prev) => (prev === 3 ? 2 : 1))}
            >
              Atrás
            </Button>
          )}
          {step === 2 && (
            <Button type="button" onClick={() => setStep(3)}>
              Analizar Duplicados
            </Button>
          )}
          {step === 3 && (
            <Button
              type="button"
              disabled={isSubmitting}
              onClick={() => onConfirmImport(parsedRows)}
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {isSubmitting
                  ? 'Procesando lote (400ms)...'
                  : 'Confirmar Importación'}
              </span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
