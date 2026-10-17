import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  Eraser,
  FileSignature,
  MapPin,
  Navigation,
  Pause,
  Play,
  Save,
  Sparkles,
  Trash2,
  Truck,
  Wrench,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { VisitStatusBadge } from '@/components/common/VisitStatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fieldExecutionService } from '../api/field-execution.service';
import type { ChecklistResultItem } from '@/types/field.types';

function formatChronometer(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Comprime una imagen en cliente usando HTML5 Canvas (máx 1024px, JPEG 0.72)
 */
async function compressImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1024;
        let width = img.width;
        let height = img.height;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar Canvas de compresión.'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => reject(new Error('Error al leer imagen.'));
      img.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error('Error al cargar archivo.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Genera una fotografía técnica simulada con telemetría estampada para pruebas rápidas en 1 clic
 */
function generateSimulatedTechnicalPhoto(
  visitCode: string,
  branchName: string
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 720;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fondo técnico oscuro
  ctx.fillStyle = '#1F2926';
  ctx.fillRect(0, 0, 720, 420);

  // Cuadrícula de osciloscopio / telemetría
  ctx.strokeStyle = 'rgba(13, 105, 80, 0.35)';
  ctx.lineWidth = 1;
  for (let x = 0; x < 720; x += 36) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 420);
    ctx.stroke();
  }
  for (let y = 0; y < 420; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(720, y);
    ctx.stroke();
  }

  // Onda sinusoidal verde corporativa
  ctx.strokeStyle = '#0D6950';
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 40; x <= 680; x += 4) {
    const y = 190 + Math.sin((x - 40) * 0.035) * 55;
    if (x === 40) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Textos de estampa de auditoría
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px Montserrat, sans-serif';
  ctx.fillText(`SUMAUP360 FIELD • EVIDENCIA TÉCNICA`, 32, 48);

  ctx.fillStyle = '#E6F2EF';
  ctx.font = '15px monospace';
  ctx.fillText(`ORDEN: ${visitCode} | SEDE: ${branchName}`, 32, 82);
  ctx.fillText(
    `LECTURA UPS: IN 220.4V AC / OUT 220.0V AC / BAT 54.2V DC (OK)`,
    32,
    340
  );
  ctx.fillText(`TIMESTAMP: ${new Date().toISOString()}`, 32, 372);

  return canvas.toDataURL('image/jpeg', 0.8);
}

export function VisitExecutionWizardPage() {
  const { visitId = '' } = useParams<{ visitId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const technicianId = user?.technicianId ?? 'tech-01';

  const {
    data: visit,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['field', 'visit-detail', visitId, technicianId],
    queryFn: () =>
      fieldExecutionService.getVisitDetailForTechnician(visitId, technicianId),
    enabled: Boolean(visitId),
  });

  // Estados locales del formulario técnico (con autoguardado en localStorage)
  const draftKey = `sumaup360-draft-${visitId}`;
  const [checklist, setChecklist] = useState<ChecklistResultItem[]>([]);
  const [diagnostics, setDiagnostics] = useState('');
  const [solutionApplied, setSolutionApplied] = useState('');
  const [sparePartsUsed, setSparePartsUsed] = useState('');
  const [pauseReason, setPauseReason] = useState('');
  const [gpsFallbackInput, setGpsFallbackInput] = useState('');
  const [showGpsFallbackBox, setShowGpsFallbackBox] = useState(false);
  const [photoCaption, setPhotoCaption] = useState('');

  // Estados de Conformidad y Cierre (Pasos 6 y 7)
  const [receiverName, setReceiverName] = useState('');
  const [receiverRole, setReceiverRole] = useState('Jefe de Mantenimiento / Sede');
  const [receiverDocument, setReceiverDocument] = useState('');
  const [finalStatus, setFinalStatus] = useState<
    'COMPLETADA' | 'CON_PENDIENTES'
  >('COMPLETADA');
  const [pendingIssuesDescription, setPendingIssuesDescription] = useState('');
  const [hasDrawnSignature, setHasDrawnSignature] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Cronómetro en vivo (JetBrains Mono)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Referencia al Canvas de firma táctil
  const signatureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  // Inicializar estado desde la visita o borrador local
  useEffect(() => {
    if (!visit?.execution) return;
    const exec = visit.execution;
    setElapsedSeconds(exec.effectiveWorkSeconds || 0);

    const savedDraftRaw = localStorage.getItem(draftKey);
    if (
      savedDraftRaw &&
      !['COMPLETADA', 'CON_PENDIENTES'].includes(visit.status)
    ) {
      try {
        const draft = JSON.parse(savedDraftRaw) as {
          checklist?: ChecklistResultItem[];
          diagnostics?: string;
          solutionApplied?: string;
          sparePartsUsed?: string;
        };
        setChecklist(
          draft.checklist && draft.checklist.length > 0
            ? draft.checklist
            : exec.checklistResults
        );
        setDiagnostics(draft.diagnostics ?? exec.diagnostics ?? '');
        setSolutionApplied(
          draft.solutionApplied ?? exec.solutionApplied ?? ''
        );
        setSparePartsUsed(draft.sparePartsUsed ?? exec.sparePartsUsed ?? '');
      } catch {
        setChecklist(exec.checklistResults);
        setDiagnostics(exec.diagnostics);
        setSolutionApplied(exec.solutionApplied);
        setSparePartsUsed(exec.sparePartsUsed ?? '');
      }
    } else {
      setChecklist(exec.checklistResults);
      setDiagnostics(exec.diagnostics);
      setSolutionApplied(exec.solutionApplied);
      setSparePartsUsed(exec.sparePartsUsed ?? '');
    }

    if (exec.signOff) {
      setReceiverName(exec.signOff.receiverName);
      setReceiverRole(exec.signOff.receiverRole ?? '');
      setReceiverDocument(exec.signOff.receiverDocument ?? '');
      setHasDrawnSignature(true);
    }
    if (exec.pendingIssuesDescription) {
      setPendingIssuesDescription(exec.pendingIssuesDescription);
      setFinalStatus('CON_PENDIENTES');
    }
  }, [visit, draftKey]);

  // Autoguardado en localStorage al editar checklist o informe
  useEffect(() => {
    if (!visitId || checklist.length === 0) return;
    localStorage.setItem(
      draftKey,
      JSON.stringify({
        checklist,
        diagnostics,
        solutionApplied,
        sparePartsUsed,
      })
    );
  }, [visitId, draftKey, checklist, diagnostics, solutionApplied, sparePartsUsed]);

  // Tick del cronómetro cada segundo cuando la visita está EN_CURSO
  useEffect(() => {
    if (visit?.status !== 'EN_CURSO') return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [visit?.status]);

  const invalidateAllOperationalQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['field'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['monitoring'] });
    queryClient.invalidateQueries({ queryKey: ['reports'] });
    queryClient.invalidateQueries({ queryKey: ['scheduling'] });
  };

  const transitMutation = useMutation({
    mutationFn: () => fieldExecutionService.startTransit(visitId),
    onSuccess: () => {
      invalidateAllOperationalQueries();
      setStatusFeedback('Traslado iniciado. Dirígete a la sede del cliente.');
    },
  });

  const arrivalMutation = useMutation({
    mutationFn: fieldExecutionService.confirmArrival,
    onSuccess: () => {
      invalidateAllOperationalQueries();
      setShowGpsFallbackBox(false);
      setStatusFeedback('Llegada a sede registrada correctamente.');
    },
  });

  const startWorkMutation = useMutation({
    mutationFn: () => fieldExecutionService.startWork(visitId),
    onSuccess: () => {
      invalidateAllOperationalQueries();
      setStatusFeedback('Atención en curso. Cronómetro técnico activo.');
    },
  });

  const pauseWorkMutation = useMutation({
    mutationFn: fieldExecutionService.pauseWork,
    onSuccess: () => {
      invalidateAllOperationalQueries();
      setPauseReason('');
      setStatusFeedback('Visita en pausa. Tiempo efectivo resguardado.');
    },
  });

  const resumeWorkMutation = useMutation({
    mutationFn: () => fieldExecutionService.resumeWork(visitId),
    onSuccess: () => {
      invalidateAllOperationalQueries();
      setStatusFeedback('Atención reanudada.');
    },
  });

  const saveProgressMutation = useMutation({
    mutationFn: fieldExecutionService.saveTechnicalProgress,
    onSuccess: () => {
      invalidateAllOperationalQueries();
      setStatusFeedback('Avance de checklist e informe guardado.');
    },
  });

  const addEvidenceMutation = useMutation({
    mutationFn: fieldExecutionService.addPhotoEvidence,
    onSuccess: () => {
      invalidateAllOperationalQueries();
      setPhotoCaption('');
      setStatusFeedback('Fotografía comprimida y adjuntada al acta.');
    },
  });

  const removeEvidenceMutation = useMutation({
    mutationFn: fieldExecutionService.removePhotoEvidence,
    onSuccess: () => {
      invalidateAllOperationalQueries();
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: fieldExecutionService.finalizeVisit,
    onSuccess: (closedVisit) => {
      localStorage.removeItem(draftKey);
      invalidateAllOperationalQueries();
      setStatusFeedback(
        `Orden ${closedVisit.code} cerrada exitosamente como ${closedVisit.status}.`
      );
      setTimeout(() => {
        navigate('/field/agenda?tab=history');
      }, 900);
    },
  });

  // Captura de GPS real con fallback automático amigable
  const handleConfirmGpsArrival = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          arrivalMutation.mutate({
            visitId,
            coordinates: {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: Math.round(pos.coords.accuracy || 12),
            },
          });
        },
        () => {
          // Si el navegador bloquea o no tiene GPS activo, usa las coordenadas de la sede con precisión simulada
          arrivalMutation.mutate({
            visitId,
            coordinates: {
              lat: visit?.branchCoordinates?.lat ?? -12.0964,
              lng: visit?.branchCoordinates?.lng ?? -77.0247,
              accuracy: 15,
            },
          });
        },
        { timeout: 5000 }
      );
    } else {
      arrivalMutation.mutate({
        visitId,
        coordinates: {
          lat: visit?.branchCoordinates?.lat ?? -12.0964,
          lng: visit?.branchCoordinates?.lng ?? -77.0247,
          accuracy: 15,
        },
      });
    }
  };

  // Manejo de subida de archivo de cámara/galería con compresión Canvas
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file);
      addEvidenceMutation.mutate({
        visitId,
        dataUrl: compressedDataUrl,
        caption: photoCaption || file.name,
      });
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Error al comprimir fotografía.'
      );
    } finally {
      e.target.value = '';
    }
  };

  const handleGenerateDemoPhoto = () => {
    if (!visit) return;
    const dataUrl = generateSimulatedTechnicalPhoto(
      visit.code,
      visit.branchName
    );
    addEvidenceMutation.mutate({
      visitId,
      dataUrl,
      caption:
        photoCaption || 'Medición de parámetros UPS y tablero en sede',
    });
  };

  // Funciones de dibujo en el Canvas de firma táctil
  const getCanvasPoint = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    const { x, y } = getCanvasPoint(e);
    ctx.strokeStyle = '#1F2926';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasDrawnSignature(true);
  };

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCanvasPoint(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawnSignature(false);
  };

  // Validación integral CA-05 y Cierre de Visita
  const handleFinalizeVisit = () => {
    setValidationError(null);
    if (!visit) return;

    const missingRequiredItems = checklist.filter(
      (item) => item.isRequired && !item.completed
    );
    if (missingRequiredItems.length > 0) {
      setValidationError(
        `Debes completar todos los ítems obligatorios del checklist (${missingRequiredItems.length} pendientes).`
      );
      return;
    }

    if (!diagnostics.trim() || !solutionApplied.trim()) {
      setValidationError(
        'El Diagnóstico en Sitio y los Trabajos Realizados son obligatorios para cerrar el acta.'
      );
      return;
    }

    const evidencesCount = visit.execution?.evidences.length ?? 0;
    if (evidencesCount === 0) {
      setValidationError(
        'Debes adjuntar al menos 1 evidencia fotográfica antes de cerrar la visita (CA-05).'
      );
      return;
    }

    if (!receiverName.trim()) {
      setValidationError(
        'Ingresa el nombre de la persona que recepciona y da conformidad en la sede.'
      );
      return;
    }

    if (!hasDrawnSignature) {
      setValidationError(
        'El responsable de sede debe firmar en el recuadro táctil de conformidad.'
      );
      return;
    }

    if (
      finalStatus === 'CON_PENDIENTES' &&
      !pendingIssuesDescription.trim()
    ) {
      setValidationError(
        'Al cerrar CON PENDIENTES, debes detallar obligatoriamente el hallazgo o repuesto requerido.'
      );
      return;
    }

    const signatureDataUrl =
      signatureCanvasRef.current?.toDataURL('image/png') ||
      visit.execution?.signOff?.signatureDataUrl ||
      '';

    finalizeMutation.mutate({
      visitId: visit.id,
      effectiveWorkSeconds: Math.max(60, elapsedSeconds),
      checklistResults: checklist,
      diagnostics,
      solutionApplied,
      sparePartsUsed,
      signOff: {
        receiverName: receiverName.trim(),
        receiverRole: receiverRole.trim(),
        receiverDocument: receiverDocument.trim(),
        signatureDataUrl,
      },
      finalStatus,
      pendingIssuesDescription,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-32 animate-pulse rounded-lg bg-white p-4" />
        <div className="h-64 animate-pulse rounded-lg bg-white p-4" />
      </div>
    );
  }

  if (error || !visit) {
    return (
      <div className="rounded-lg border border-[#A8262B]/40 bg-white p-6 text-center">
        <AlertTriangle className="mx-auto h-8 w-8 text-[#A8262B]" />
        <p className="mt-2 text-sm font-bold text-[#1F2926]">
          {error instanceof Error
            ? error.message
            : 'No se pudo abrir la orden solicitada.'}
        </p>
        <Button asChild className="mt-4 bg-[#0D6950] text-white">
          <Link to="/field/agenda">Volver a Mi Agenda</Link>
        </Button>
      </div>
    );
  }

  const isClosed = ['COMPLETADA', 'CON_PENDIENTES'].includes(visit.status);
  const completedChecklistCount = checklist.filter((c) => c.completed).length;

  return (
    <div className="space-y-4 pb-6">
      {/* Cabecera de la Orden de Visita */}
      <div className="rounded-lg border border-[#E0E6E4] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <Link
            to="/field/agenda"
            className="inline-flex items-center gap-1 text-xs font-bold text-[#0D6950] hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Mi Agenda
          </Link>
          <span className="font-mono text-xs font-bold text-[#1F2926]">
            {visit.code}
          </span>
          <VisitStatusBadge status={visit.status} />
        </div>

        <h1 className="mt-2 text-base font-bold text-[#1F2926]">
          {visit.clientName}
        </h1>
        <p className="text-xs font-semibold text-[#0D6950]">{visit.title}</p>

        <div className="mt-2 flex items-start gap-2 rounded bg-[#F4F6F6] p-2.5 text-xs text-[#1F2926]">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#0D6950]" />
          <div>
            <p className="font-semibold">
              {visit.branchName} • {visit.branchZone}
            </p>
            <p className="text-[11px] text-[#78909C]">{visit.branchAddress}</p>
          </div>
        </div>
      </div>

      {statusFeedback && (
        <div className="flex items-center justify-between rounded-md border border-[#0D6950]/40 bg-[#E6F2EF] px-3.5 py-2.5 text-xs font-semibold text-[#0D6950]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {statusFeedback}
          </span>
          <button
            type="button"
            onClick={() => setStatusFeedback(null)}
            className="underline"
          >
            OK
          </button>
        </div>
      )}

      {validationError && (
        <div className="rounded-md border border-[#A8262B] bg-[#F9E8E9] p-3 text-xs font-semibold text-[#A8262B]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        </div>
      )}

      {/* PASO 2: TRASLADO Y LLEGADA GPS */}
      <div className="rounded-lg border border-[#E0E6E4] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F2926]">
            <Truck className="h-4 w-4 text-[#0D6950]" />
            Paso 2 · Traslado y Llegada a Sede
          </h2>
          {visit.execution?.arrivedAt && (
            <span className="rounded bg-[#E6F2EF] px-2 py-0.5 font-mono text-[10px] font-bold text-[#0D6950]">
              Check-In OK
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            type="button"
            disabled={
              isClosed ||
              Boolean(visit.execution?.transitStartedAt) ||
              transitMutation.isPending
            }
            onClick={() => transitMutation.mutate()}
            className="min-h-[48px] bg-[#0D6950] text-xs font-bold text-white hover:bg-[#0B533E]"
          >
            <Navigation className="mr-2 h-4 w-4" />
            {visit.execution?.transitStartedAt
              ? 'Traslado Iniciado ✓'
              : '1. Iniciar Traslado'}
          </Button>

          <Button
            type="button"
            disabled={
              isClosed ||
              Boolean(visit.execution?.arrivedAt) ||
              arrivalMutation.isPending
            }
            onClick={handleConfirmGpsArrival}
            className="min-h-[48px] bg-[#1F2926] text-xs font-bold text-white hover:bg-[#1F2926]/90"
          >
            <MapPin className="mr-2 h-4 w-4 text-[#0D6950]" />
            {visit.execution?.arrivedAt
              ? 'Llegada Confirmada ✓'
              : '2. Confirmar Llegada GPS'}
          </Button>
        </div>

        {/* Información de coordenadas o botón de contingencia */}
        {visit.execution?.checkInCoordinates ? (
          <p className="mt-2 font-mono text-[11px] text-[#0D6950]">
            GPS Registrado:{' '}
            {visit.execution.checkInCoordinates.lat.toFixed(4)},{' '}
            {visit.execution.checkInCoordinates.lng.toFixed(4)} (±
            {visit.execution.checkInCoordinates.accuracy}m)
          </p>
        ) : visit.execution?.gpsFallbackReason ? (
          <p className="mt-2 text-[11px] font-semibold text-[#A8262B]">
            Contingencia registrada: {visit.execution.gpsFallbackReason}
          </p>
        ) : (
          !isClosed && (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowGpsFallbackBox((v) => !v)}
                className="text-[11px] font-semibold text-[#78909C] underline hover:text-[#1F2926]"
              >
                ¿Sótano / Sin cobertura GPS? Registrar llegada manual
              </button>
              {showGpsFallbackBox && (
                <div className="mt-2 flex gap-2">
                  <Input
                    value={gpsFallbackInput}
                    onChange={(e) => setGpsFallbackInput(e.target.value)}
                    placeholder="Motivo (ej. Cuarto eléctrico en Sótano 3 sin señal)"
                    className="h-9 text-xs"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      arrivalMutation.mutate({
                        visitId,
                        gpsFallbackReason:
                          gpsFallbackInput.trim() ||
                          'Sótano técnico sin cobertura GPS',
                      })
                    }
                    className="bg-[#A8262B] text-xs text-white hover:bg-[#8A1E22]"
                  >
                    Guardar
                  </Button>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* PASO 3: CRONÓMETRO EN VIVO Y CONTROL DE PAUSAS */}
      <div className="rounded-lg border border-[#E0E6E4] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F2926]">
            <Wrench className="h-4 w-4 text-[#0D6950]" />
            Paso 3 · Tiempo Efectivo de Atención
          </h2>
          <span className="font-mono text-xs text-[#78909C]">
            Est: {visit.estimatedDurationMinutes} min
          </span>
        </div>

        {/* Display digital en JetBrains Mono */}
        <div className="mt-3 rounded-lg bg-[#1F2926] p-4 text-center text-white">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#78909C]">
            Cronómetro Técnico Efectivo
          </p>
          <p className="mt-1 font-mono text-3xl font-bold tracking-wider text-[#0D6950]">
            {formatChronometer(elapsedSeconds)}
          </p>
          <p className="mt-1 text-[11px] text-[#E0E6E4]">
            {visit.status === 'EN_CURSO'
              ? 'Atención en curso • Contabilizando tiempo real'
              : visit.status === 'PAUSADA'
                ? 'Cronómetro en pausa operativa'
                : 'Inicia la atención para activar el cronómetro'}
          </p>
        </div>

        {!isClosed && (
          <div className="mt-3 space-y-2">
            {visit.status !== 'EN_CURSO' && visit.status !== 'PAUSADA' && (
              <Button
                type="button"
                onClick={() => startWorkMutation.mutate()}
                disabled={startWorkMutation.isPending}
                className="min-h-[48px] w-full bg-[#0D6950] text-xs font-bold text-white hover:bg-[#0B533E]"
              >
                <Play className="mr-2 h-4 w-4" />
                Iniciar Atención en Sitio (EN CURSO)
              </Button>
            )}

            {visit.status === 'EN_CURSO' && (
              <div className="flex gap-2">
                <Input
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  placeholder="Motivo de pausa (ej. espera de acceso a gabinete)"
                  className="h-11 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    pauseWorkMutation.mutate({
                      visitId,
                      reason: pauseReason,
                      effectiveWorkSeconds: elapsedSeconds,
                    })
                  }
                  className="h-11 shrink-0 border-[#A8262B] text-xs font-bold text-[#A8262B] hover:bg-[#F9E8E9]"
                >
                  <Pause className="mr-1.5 h-4 w-4" />
                  Pausar
                </Button>
              </div>
            )}

            {visit.status === 'PAUSADA' && (
              <Button
                type="button"
                onClick={() => resumeWorkMutation.mutate()}
                className="min-h-[48px] w-full bg-[#0D6950] text-xs font-bold text-white hover:bg-[#0B533E]"
              >
                <Play className="mr-2 h-4 w-4" />
                Reanudar Atención Técnica
              </Button>
            )}
          </div>
        )}
      </div>

      {/* PASO 4: CHECKLIST TÁCTIL E INFORME TÉCNICO */}
      <div className="rounded-lg border border-[#E0E6E4] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F2926]">
            <ClipboardCheck className="h-4 w-4 text-[#0D6950]" />
            Paso 4 · Checklist e Informe Técnico
          </h2>
          <span className="font-mono text-xs font-bold text-[#0D6950]">
            {completedChecklistCount}/{checklist.length}
          </span>
        </div>

        <div className="mt-3 space-y-2">
          {checklist.map((item) => (
            <label
              key={item.itemId}
              className={`flex min-h-[48px] cursor-pointer items-center justify-between gap-3 rounded-md border p-3 text-xs transition-colors ${
                item.completed
                  ? 'border-[#0D6950]/40 bg-[#E6F2EF]/50'
                  : 'border-[#E0E6E4] bg-[#F4F6F6]/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  disabled={isClosed}
                  checked={item.completed}
                  onChange={(e) =>
                    setChecklist((prev) =>
                      prev.map((c) =>
                        c.itemId === item.itemId
                          ? { ...c, completed: e.target.checked }
                          : c
                      )
                    )
                  }
                  className="h-5 w-5 rounded border-[#E0E6E4] accent-[#0D6950]"
                />
                <span className="font-medium text-[#1F2926]">{item.label}</span>
              </div>
              {item.isRequired && (
                <span className="shrink-0 rounded bg-white px-2 py-0.5 text-[10px] font-bold text-[#A8262B]">
                  Obligatorio
                </span>
              )}
            </label>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          <div>
            <Label className="text-xs font-bold text-[#1F2926]">
              Diagnóstico Técnico en Sitio *
            </Label>
            <textarea
              rows={2}
              disabled={isClosed}
              value={diagnostics}
              onChange={(e) => setDiagnostics(e.target.value)}
              placeholder="Describe el estado inicial encontrado, mediciones eléctricas y hallazgos..."
              className="mt-1 w-full rounded-md border border-[#E0E6E4] bg-white p-2.5 text-xs text-[#1F2926] focus:border-[#0D6950] focus:outline-none"
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-[#1F2926]">
              Trabajos Realizados y Solución Aplicada *
            </Label>
            <textarea
              rows={2}
              disabled={isClosed}
              value={solutionApplied}
              onChange={(e) => setSolutionApplied(e.target.value)}
              placeholder="Detalla el mantenimiento ejecutado, calibraciones y pruebas de transferencia..."
              className="mt-1 w-full rounded-md border border-[#E0E6E4] bg-white p-2.5 text-xs text-[#1F2926] focus:border-[#0D6950] focus:outline-none"
            />
          </div>

          <div>
            <Label className="text-xs font-bold text-[#1F2926]">
              Repuestos / Insumos Utilizados (Opcional)
            </Label>
            <Input
              disabled={isClosed}
              value={sparePartsUsed}
              onChange={(e) => setSparePartsUsed(e.target.value)}
              placeholder="Ej. 2 Fusibles 32A, alcohol isopropílico, terminales..."
              className="mt-1 h-10 text-xs"
            />
          </div>

          {!isClosed && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                saveProgressMutation.mutate({
                  visitId,
                  effectiveWorkSeconds: elapsedSeconds,
                  checklistResults: checklist,
                  diagnostics,
                  solutionApplied,
                  sparePartsUsed,
                })
              }
              disabled={saveProgressMutation.isPending}
              className="min-h-[44px] w-full border-[#0D6950] text-xs font-bold text-[#0D6950] hover:bg-[#E6F2EF]"
            >
              <Save className="mr-2 h-4 w-4" />
              Guardar Avance en Servidor (Autoguardado Local Activo)
            </Button>
          )}
        </div>
      </div>

      {/* PASO 5: EVIDENCIAS FOTOGRÁFICAS CON COMPRESIÓN EN CLIENTE */}
      <div className="rounded-lg border border-[#E0E6E4] bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F2926]">
            <Camera className="h-4 w-4 text-[#0D6950]" />
            Paso 5 · Evidencias Fotográficas (Comprimidas)
          </h2>
          <span className="font-mono text-xs font-bold text-[#0D6950]">
            {visit.execution?.evidences.length ?? 0} fotos
          </span>
        </div>

        {!isClosed && (
          <div className="mt-3 space-y-2">
            <Input
              value={photoCaption}
              onChange={(e) => setPhotoCaption(e.target.value)}
              placeholder="Leyenda de la foto (ej. Banco de baterías antes/después)"
              className="h-10 text-xs"
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-md bg-[#0D6950] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0B533E]">
                <Camera className="h-4 w-4" />
                <span>Tomar / Subir Foto</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <Button
                type="button"
                variant="outline"
                onClick={handleGenerateDemoPhoto}
                disabled={addEvidenceMutation.isPending}
                className="min-h-[48px] border-[#0D6950]/50 text-xs font-bold text-[#0D6950] hover:bg-[#E6F2EF]"
              >
                <Sparkles className="mr-1.5 h-4 w-4" />
                Generar Foto Técnica Demo
              </Button>
            </div>
          </div>
        )}

        {visit.execution?.evidences && visit.execution.evidences.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-2">
            {visit.execution.evidences.map((ev) => (
              <div
                key={ev.id}
                className="overflow-hidden rounded-md border border-[#E0E6E4]"
              >
                <img
                  src={ev.url}
                  alt={ev.caption}
                  className="h-36 w-full bg-[#1F2926] object-cover"
                />
                <div className="flex items-center justify-between bg-[#F4F6F6] px-3 py-1.5 text-xs">
                  <span className="font-medium text-[#1F2926]">
                    {ev.caption}
                  </span>
                  {!isClosed && (
                    <button
                      type="button"
                      onClick={() =>
                        removeEvidenceMutation.mutate({
                          visitId,
                          evidenceId: ev.id,
                        })
                      }
                      className="text-[#A8262B] hover:opacity-80"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PASO 6: CONFORMIDAD Y FIRMA EN CANVAS TÁCTIL */}
      <div className="rounded-lg border border-[#E0E6E4] bg-white p-4 shadow-sm">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1F2926]">
          <FileSignature className="h-4 w-4 text-[#0D6950]" />
          Paso 6 · Conformidad del Cliente en Sede
        </h2>

        <div className="mt-3 space-y-2.5">
          <div>
            <Label className="text-xs font-semibold text-[#1F2926]">
              Nombre Completo del Receptor *
            </Label>
            <Input
              disabled={isClosed}
              value={receiverName}
              onChange={(e) => setReceiverName(e.target.value)}
              placeholder="Ej. Ing. Roberto Vargas"
              className="mt-1 h-10 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-semibold text-[#1F2926]">
                Cargo en Sede
              </Label>
              <Input
                disabled={isClosed}
                value={receiverRole}
                onChange={(e) => setReceiverRole(e.target.value)}
                className="mt-1 h-10 text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-[#1F2926]">
                DNI / Documento
              </Label>
              <Input
                disabled={isClosed}
                value={receiverDocument}
                onChange={(e) => setReceiverDocument(e.target.value)}
                placeholder="45892103"
                className="mt-1 h-10 font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-[#1F2926]">
                Firma Digital sobre Pantalla *
              </Label>
              {!isClosed && (
                <button
                  type="button"
                  onClick={clearSignatureCanvas}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#78909C] hover:text-[#A8262B]"
                >
                  <Eraser className="h-3.5 w-3.5" />
                  Limpiar Firma
                </button>
              )}
            </div>

            {isClosed && visit.execution?.signOff?.signatureDataUrl ? (
              <div className="mt-1 rounded border border-[#E0E6E4] bg-[#F4F6F6] p-3 text-center">
                <img
                  src={visit.execution.signOff.signatureDataUrl}
                  alt="Firma registrada"
                  className="mx-auto h-24 object-contain"
                />
              </div>
            ) : (
              <div className="mt-1 overflow-hidden rounded-md border-2 border-dashed border-[#0D6950]/50 bg-[#F4F6F6]/50">
                <canvas
                  ref={signatureCanvasRef}
                  width={360}
                  height={140}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="h-36 w-full cursor-crosshair touch-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PASO 7: CIERRE DE VISITA (COMPLETADA vs CON PENDIENTES - CA-05) */}
      {!isClosed && (
        <div className="rounded-lg border-2 border-[#0D6950] bg-white p-4 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#1F2926]">
            Paso 7 · Resultado Final y Cierre de Acta (CA-05)
          </h2>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFinalStatus('COMPLETADA')}
              className={`min-h-[48px] rounded-md border p-2.5 text-left text-xs font-bold transition-all ${
                finalStatus === 'COMPLETADA'
                  ? 'border-[#0D6950] bg-[#E6F2EF] text-[#0D6950]'
                  : 'border-[#E0E6E4] text-[#78909C]'
              }`}
            >
              ✓ COMPLETADA
              <span className="mt-0.5 block text-[10px] font-normal">
                Sin pendientes críticos
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFinalStatus('CON_PENDIENTES')}
              className={`min-h-[48px] rounded-md border p-2.5 text-left text-xs font-bold transition-all ${
                finalStatus === 'CON_PENDIENTES'
                  ? 'border-[#A8262B] bg-[#F9E8E9] text-[#A8262B]'
                  : 'border-[#E0E6E4] text-[#78909C]'
              }`}
            >
              ⚠ CON PENDIENTES
              <span className="mt-0.5 block text-[10px] font-normal">
                Requiere repuesto / seguimiento
              </span>
            </button>
          </div>

          {finalStatus === 'CON_PENDIENTES' && (
            <div className="mt-3">
              <Label className="text-xs font-bold text-[#A8262B]">
                Detalle del Pendiente Técnico para Supervisión (CA-06) *
              </Label>
              <textarea
                rows={2}
                value={pendingIssuesDescription}
                onChange={(e) => setPendingIssuesDescription(e.target.value)}
                placeholder="Ej. Se requiere cambio de ventilador axial 24VDC y 2 baterías 12V 9Ah en próxima visita..."
                className="mt-1 w-full rounded-md border border-[#A8262B] bg-white p-2.5 text-xs text-[#1F2926] focus:outline-none"
              />
            </div>
          )}

          <Button
            type="button"
            onClick={handleFinalizeVisit}
            disabled={finalizeMutation.isPending}
            className={`mt-4 min-h-[52px] w-full text-sm font-bold text-white shadow-md ${
              finalStatus === 'CON_PENDIENTES'
                ? 'bg-[#A8262B] hover:bg-[#8A1E22]'
                : 'bg-[#0D6950] hover:bg-[#0B533E]'
            }`}
          >
            {finalizeMutation.isPending
              ? 'Cerrando y Sincronizando Acta...'
              : `Finalizar y Emitir Acta (${finalStatus})`}
          </Button>
        </div>
      )}
    </div>
  );
}
