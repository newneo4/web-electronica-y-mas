# Especificación de Arquitectura y Features Frontend — SUMAUP360 Field (MVP 1.0)

**Cliente:** ELECTRÓNICA & MÁS EIRL  
**Proyecto:** SUMAUP360 Field (Sistema Web de Gestión + App Móvil PWA para Técnicos)  
**Propósito de este documento:** Guía maestra de arquitectura, módulos, componentes, rutas, estados e interfaces de datos para la generación e implementación del frontend inicial por parte de agentes de desarrollo o ingenieros de software.

---

## 1. Contexto Técnico y Reglas de Arquitectura para el Agente

1. **Dos Interfaces en un Ecosistema Unificado:**
   * **Entregable A (Sistema Web de Gestión):** Interfaz *Desktop-First* tipo ERP operativo para roles `ADMIN`, `COORDINADOR` y `SUPERVISOR`. Alta densidad de información, tablas, filtros avanzados y calendarios.
   * **Entregable B (App Móvil PWA para Técnicos):** Interfaz *Mobile-First* e instalable (PWA con `manifest.json` y Service Worker básico) para rol `TECNICO` en Android. Botones táctiles de mínimo $48\text{ px}$ de alto, alto contraste y flujo secuencial de 7 pasos.
2. **Alineación con el Sistema de Diseño (`DESIGN_SYSTEM.md`):**
   * **Verde Principal (`#0D6950`):** Navegación activa, encabezados, estados en curso, botones primarios.
   * **Verde Oscuro (`#0B533E`):** Estados hover, sidebar del sistema web.
   * **Rojo Acento (`#A8262B`):** Alertas de cruces horarios, visitas vencidas, pendientes críticos y CTAs principales de cierre/confirmación.
   * **Tipografía:** `Montserrat` / `Inter` para interfaz general; `JetBrains Mono` / `Roboto Mono` para cronómetros, sellos de tiempo y métricas técnicas.
3. **Límites del Alcance (Restricciones del MVP):**
   * **NO implementar:** Sincronización offline compleja (solo persistencia local preventiva en el formulario activo mediante `localStorage`/`IndexedDB` para no perder datos ante microcortes), rastreo GPS en vivo continuo (solo captura puntual de coordenadas en el *check-in*), optimización matemática de rutas con tráfico, facturación electrónica ni portal de clientes.

---

## 2. Estructura de Directorios (Feature-Based Architecture)

El agente debe estructurar el código fuente bajo una arquitectura modular orientada a dominios (*Feature-Sliced* / *Feature-Based*):

```text
src/
├── core/
│   ├── api/                   # Cliente HTTP (Axios/Fetch), interceptores JWT, manejo de errores
│   ├── auth/                  # Contexto de autenticación, RoleGuards (Admin vs Técnico)
│   ├── pwa/                   # Configuración de Service Worker, manifest, detector de red, prompt de instalación
│   └── config/                # Variables de entorno, constantes globales
├── shared/
│   ├── components/            # UI Kit atómico basado en DESIGN_SYSTEM.md
│   │   ├── Button/            # Variantes: primary (#0D6950), accent (#A8262B), outline, ghost
│   │   ├── Badge/             # Etiquetas semánticas para los estados de la visita
│   │   ├── Card/              # Contenedores con border-radius: 12px y sombra suave
│   │   ├── Modal/             # Diálogos y Drawers laterales
│   │   ├── DataTable/         # Tabla reutilizable con paginación, búsqueda y ordenamiento
│   │   └── FormControls/      # Inputs (44px desktop / 48px mobile), Selects, Checkboxes
│   ├── hooks/                 # useGeolocation, useChronometer, useLocalStorageDraft, useDebounce
│   └── utils/                 # Formateadores de fechas, validadores de cruces horarios, compresor de imágenes
├── layouts/
│   ├── AdminLayout/           # Sidebar fija (#1F2926 o #0B533E), Topbar, contenedor fluido
│   └── FieldPwaLayout/        # Topbar compacta con estado de visita/red, contenedor móvil (max-w-md), BottomNav
├── features/
│   ├── auth/                  # Login unificado con redirección automática según rol
│   ├── dashboard/             # [Web M01] Tablero de control operativo del día
│   ├── clients/               # [Web M02] Gestión de clientes, sedes, contactos, historial e importador Excel
│   ├── technicians/           # [Web M03] Gestión de técnicos, especialidades, zonas y horarios
│   ├── service-plans/         # [Web M04] Configuración de planes preventivos, frecuencias y checklists
│   ├── scheduling/            # [Web M05 & M06] Agenda, generación recurrente, asignación asistida y reprogramación
│   ├── monitoring/            # [Web M07] Monitoreo de campo en tiempo real y supervisión de cierres
│   ├── reports/               # [Web M08] Reportes operativos, indicadores y exportación a Excel/CSV
│   └── field-execution/       # [PWA Técnicos] Flujo completo de 7 pasos para atención en campo
└── router/
    └── AppRouter.tsx          # Definición de rutas protegidas por rol
```

---

## 3. Máquina de Estados y Modelos de Datos Principales

El agente debe utilizar las siguientes definiciones de estado y contratos base (TypeScript interfaces) para asegurar consistencia entre el panel web y la PWA móvil:

### 3.1 Estados de una Visita (`VisitStatus`)

| Estado (`Enum`) | Etiqueta UI | Color / Token | Descripción Funcional |
| :--- | :--- | :--- | :--- |
| `POR_PROGRAMAR` | Por programar | `#78909C` (Gris) | Generada por recurrencia o creada manualmente, aún sin técnico u horario confirmado. |
| `PROGRAMADA` | Programada | `#2B7A9B` (Azul) | Asignada a un técnico en fecha/hora específica sin conflicto horario. |
| `EN_TRASLADO` | En traslado | `#E29528` (Ámbar) | El técnico registró salida hacia la sede del cliente. |
| `EN_CURSO` | En atención | `#0D6950` (Verde) | Llegada registrada (Check-in) y cronómetro de trabajo activo. |
| `PAUSADA` | En pausa | `#D97706` (Naranja)| Cronómetro de trabajo pausado temporalmente por el técnico. |
| `COMPLETADA` | Terminada | `#0D6950` (Éxito) | Cerrada con checklist, evidencias y conformidad sin pendientes. |
| `CON_PENDIENTES`| Con pendientes| `#A8262B` (Rojo) | Finalizada en campo pero marcada con seguimiento o incidencia por resolver. |
| `VENCIDA` | Vencida | `#8A1E22` (Rojo Osc)| Fecha programada superada sin haberse ejecutado ni reprogramado. |

### 3.2 Entidades Principales (Interfaces de Referencia)

```typescript
export type Role = 'ADMIN' | 'COORDINADOR' | 'SUPERVISOR' | 'TECNICO';

export type FrequencyType = 'SEMANAL' | 'QUINCENAL' | 'MENSUAL' | 'PERSONALIZADA';

export interface Client {
  id: string;
  ruc: string;
  businessName: string;
  status: 'ACTIVO' | 'INACTIVO';
  branches: Branch[];
  createdAt: string;
}

export interface Branch {
  id: string;
  clientId: string;
  name: string;               // Ej: "Sede San Isidro"
  address: string;
  zone: string;               // Para sugerencia de asignación por zona
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  coordinates?: { lat: number; lng: number };
}

export interface Technician {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  specialties: string[];      // Ej: ["Redes", "Servidores", "CCTV"]
  assignedZones: string[];
  workSchedule: {
    days: number[];           // 1 (Lunes) a 6 (Sábado)
    startTime: string;        // "08:30"
    endTime: string;          // "18:00"
  };
  isActive: boolean;
}

export interface ServicePlan {
  id: string;
  clientId: string;
  branchId: string;
  title: string;
  frequency: FrequencyType;
  customIntervalDays?: number;
  estimatedDurationMinutes: number;
  checklistTemplate: ChecklistItemTemplate[];
  isActive: boolean;
}

export interface ChecklistItemTemplate {
  id: string;
  label: string;
  isRequired: boolean;
}

export interface Visit {
  id: string;
  planId?: string;
  clientId: string;
  branchId: string;
  technicianId?: string;
  scheduledDate: string;      // YYYY-MM-DD
  scheduledStartTime?: string;// HH:mm
  scheduledEndTime?: string;  // HH:mm
  status: VisitStatus;
  rescheduleHistory: {
    previousDate: string;
    newDate: string;
    reason: string;
    changedBy: string;
    timestamp: string;
  }[];
  execution?: VisitExecution;
}

export interface VisitExecution {
  transitStartedAt?: string;
  arrivedAt?: string;
  checkInCoordinates?: { lat: number; lng: number; accuracy: number };
  workStartedAt?: string;
  pauses: { startedAt: string; endedAt?: string; reason?: string }[];
  workEndedAt?: string;
  effectiveWorkSeconds: number;
  transitSeconds: number;
  checklistResults: { itemId: string; label: string; completed: boolean; note?: string }[];
  diagnostics: string;
  solutionApplied: string;
  sparePartsUsed?: string;
  evidences: { id: string; url: string; caption?: string; createdAt: string }[];
  signOff?: {
    receiverName: string;
    receiverDocument?: string;
    signatureDataUrl: string;
    signedAt: string;
  };
  hasPendingIssues: boolean;
  pendingIssuesDescription?: string;
  supervisorReviewed?: boolean;
  supervisorNotes?: string;
}
```

---

## 4. Especificación Detallada de Features — Entregable A (Sistema Web)

### Feature 01: Tablero de Control (`features/dashboard`)
* **Ruta:** `/admin/dashboard`
* **Descripción:** Vista operativa en tiempo real del día actual para toma de decisiones rápidas.
* **Componentes Requeridos:**
  1. `DailyKpiCards`: 5 tarjetas superiores con contadores e íconos: *Visitas del Día*, *Por Programar*, *En Curso*, *Terminadas* y *Vencidas* (esta última destacada en `#A8262B` si es $> 0$).
  2. `TodayVisitsTable`: Lista filtrable de las visitas del día mostrando: Hora, Cliente, Sede, Técnico asignado, Estado (`Badge`) y Progreso.
  3. `TechnicianWorkloadWidget`: Panel lateral que lista a los técnicos activos hoy, indicando cuántas visitas tienen asignadas y su estado actual (*Libre*, *En traslado*, *En sede*).
* **Reglas de Negocio:** Permitir clic directo desde cualquier visita vencida o por programar hacia el cajón de asignación/reprogramación.

### Feature 02: Clientes y Sedes (`features/clients`)
* **Rutas:** `/admin/clients`, `/admin/clients/:clientId`
* **Descripción:** Administración del padrón de ~100 clientes, sus múltiples sedes, contactos e historial unificado.
* **Componentes Requeridos:**
  1. `ClientsDataTable`: Buscador por RUC/Razón Social, filtro por zona/estado, botón de "Nuevo Cliente" y botón de "Importar desde Excel".
  2. `ExcelImportWizardModal`:
     * **Paso 1:** Carga de archivo `.xlsx` / `.csv`.
     * **Paso 2:** Mapeo y previsualización de filas.
     * **Paso 3:** Detector visual de duplicados (resalta en amarillo/rojo si el RUC o la combinación Cliente + Dirección de Sede ya existe en la base de datos) con opción de omitir o actualizar.
  3. `ClientProfileView`: Vista maestra dividida en 3 pestañas:
     * `BranchesTab`: CRUD de sedes del cliente (nombre de sede, dirección, zona, nombre y teléfono del contacto responsable).
     * `ServicePlansTab`: Planes preventivos activos asociados a cada sede.
     * `ServiceHistoryTab`: Línea de tiempo cronológica con todas las visitas ejecutadas, tiempos registrados, fotos, firma de conformidad y alertas de pendientes.

### Feature 03: Técnicos (`features/technicians`)
* **Ruta:** `/admin/technicians`
* **Descripción:** Gestión del personal técnico de campo, accesos, especialidades y disponibilidad horaria.
* **Componentes Requeridos:**
  1. `TechniciansGridOrTable`: Lista de técnicos con estado de cuenta (Activo/Inactivo), especialidades en formato `Tag`, zonas asignadas y teléfono.
  2. `TechnicianUpsertModal`: Formulario para crear/editar datos del técnico, credenciales de acceso (rol `TECNICO`), etiquetas de especialidad y configuración de su jornada laboral (`workSchedule`).
  3. `StatusToggleSwitch`: Interruptor rápido para activar/desactivar el acceso de un técnico sin borrar su historial de visitas pasadas.

### Feature 04: Planes de Servicio (`features/service-plans`)
* **Ruta:** `/admin/service-plans`
* **Descripción:** Configuración de contratos o acuerdos de mantenimiento preventivo recurrente por cliente y sede.
* **Componentes Requeridos:**
  1. `ServicePlanForm`: Selector de Cliente y Sede, título del plan, selector de frecuencia (`SEMANAL`, `QUINCENAL`, `MENSUAL`, `PERSONALIZADA`), fecha de inicio, y duración estimada en minutos.
  2. `ChecklistBuilder`: Componente interactivo para agregar, editar, reordenar o eliminar tareas de verificación que el técnico verá en su móvil cuando ejecute una visita de este plan.

### Feature 05 y 06: Agenda de Visitas y Asignación Asistida (`features/scheduling`)
* **Ruta:** `/admin/schedule`
* **Descripción:** Motor visual de planificación, generación de visitas periódicas, asignación inteligente de técnicos y reprogramación con auditoría.
* **Componentes Requeridos:**
  1. `RecurrenceGeneratorToolbar`: Barra superior con botón "Generar Visitas del Periodo". Muestra una previsualización de las visitas a crear según los planes activos.
     * *Regla Crítica (Idempotencia):* Si el usuario ejecuta la generación dos veces para el mismo rango de fechas y plan, el sistema debe omitir las ya creadas y mostrar un aviso claro de "0 duplicados generados".
  2. `InteractiveScheduleCalendar`: Calendario con vistas Mensual, Semanal y Línea de Tiempo por Técnico (Día).
  3. `UnassignedVisitsSidebar`: Columna lateral con tarjetas de visitas en estado `POR_PROGRAMAR`.
  4. `AssistedAssignmentDrawer`: Al seleccionar una visita, este panel sugiere técnicos ordenados por:
     * Compatibilidad de especialidad.
     * Coincidencia con la zona de la sede.
     * Disponibilidad en la franja horaria calculada (`scheduledStartTime` + `estimatedDurationMinutes`).
  5. `ConflictWarningBanner`: Alerta bloqueante o de advertencia explícita en color `#A8262B` si se intenta asignar a un técnico que ya tiene otra visita superpuesta en ese horario o está fuera de su jornada.
  6. `RescheduleWithReasonModal`: Cuando una visita ya `PROGRAMADA` se mueve de fecha/hora, abre un modal que exige obligatoriamente seleccionar o escribir el **motivo de la reprogramación**, guardando el registro de auditoría.

### Feature 07: Monitoreo de Campo (`features/monitoring`)
* **Ruta:** `/admin/monitoring`
* **Descripción:** Centro de supervisión en vivo del progreso de las visitas y bandeja de revisión para cierres con incidencias.
* **Componentes Requeridos:**
  1. `LiveMonitoringBoard`: Tablero dividido por columnas de estado (`EN_TRASLADO`, `EN_CURSO`, `PAUSADA`, `COMPLETADA`, `CON_PENDIENTES`).
  2. `VisitExecutionDetailDrawer`: Al hacer clic en una visita, muestra el desglose completo en tiempo real:
     * Sellos de tiempo exactos (Salida, Llegada, Inicio, Pausas, Fin).
     * Comparativa entre *Duración Estimada* vs. *Tiempo Efectivo Registrado* (en fuente monoespaciada).
     * Progreso del checklist, diagnóstico escrito, galería de fotos de evidencia y firma digital del cliente.
  3. `SupervisorIncidentResolutionBox`: Sección exclusiva para visitas en estado `CON_PENDIENTES`, permitiendo al coordinador/supervisor registrar acciones correctivas, programar una visita de seguimiento o dar el visto bueno de cierre administrativo.

### Feature 08: Reportes (`features/reports`)
* **Ruta:** `/admin/reports`
* **Descripción:** Consulta histórica, métricas de cumplimiento y exportación de datos para gerencia o clientes.
* **Componentes Requeridos:**
  1. `ReportsFilterPanel`: Filtros combinables por Rango de Fechas, Cliente, Sede, Técnico y Estado de Visita.
  2. `ComplianceSummaryCards`: Indicadores de % de visitas cumplidas en fecha vs. reprogramadas/vencidas, promedio de tiempo de traslado y promedio de tiempo efectivo por atención.
  3. `ReportDataTable` & `ExportExcelButton`: Tabla detallada de resultados con botón para descargar la vista actual en formato `.xlsx` o `.csv`.

---

## 5. Especificación Detallada de Features — Entregable B (App Móvil PWA)

Toda esta funcionalidad reside en `features/field-execution` bajo el layout `FieldPwaLayout`. Solo muestra las visitas autorizadas y asignadas al técnico autenticado (`Criterio de Aceptación 4`).

### Flujo Secuencial de 7 Pasos en Campo

#### Paso 1 · Mi Agenda (`MyAgendaView`)
* **Ruta:** `/field/agenda`
* **Componentes:**
  * `DateSelectorStrip`: Selector rápido de día (Hoy / Mañana / Semana).
  * `AssignedVisitCardList`: Tarjetas táctiles ordenadas por hora de inicio. Muestran: Hora, Cliente, Sede, Dirección, Estado actual (`Badge`).
  * `VisitBriefView` (`/field/visits/:visitId`): Pantalla de resumen previo con:
    * Datos del contacto en sede y botón de llamada rápida (`href="tel:..."`).
    * Dirección exacta y botón **"Abrir en Mapa"** (lanza Google Maps o Waze externo con la dirección/coordenadas).
    * Lista de lectura de las tareas previstas en el Plan de Servicio.

#### Paso 2 · Traslado y Llegada (`TransitAndArrivalStep`)
* **Componentes:**
  * `StartTransitButton`: Botón grande a ancho completo ("Iniciar Traslado hacia Sede"). Cambia el estado de la visita a `EN_TRASLADO` y guarda `transitStartedAt`.
  * `ConfirmArrivalButton`: Botón ("Registrar Llegada a Sede"). Al pulsarlo:
    * Captura el sello de tiempo `arrivedAt`.
    * Si el navegador tiene permisos y está activo, invoca `navigator.geolocation.getCurrentPosition()` para guardar `checkInCoordinates` (latitud, longitud y precisión). Si el permiso es denegado o falla en interiores, permite continuar registrando solo el sello de tiempo con una bandera informativa, sin bloquear el trabajo del técnico.

#### Paso 3 · Trabajo en Curso (`WorkChronometerStep`)
* **Componentes:**
  * `StickyChronometerHeader`: Barra superior fija en pantalla que muestra en tipografía `JetBrains Mono` el tiempo efectivo transcurrido (`HH:MM:SS`) y separa visualmente el tiempo de traslado ya concluido.
  * `WorkControlButtons`:
    * Botón **Iniciar Atención** (pasa la visita a `EN_CURSO` y arranca el contador).
    * Botón **Pausar Atención** (abre un mini-selector con motivos rápidos: *Almuerzo*, *Espera de cliente*, *Compra de repuesto*, *Otro* y pasa a estado `PAUSADA`).
    * Botón **Reanudar Atención**.

#### Paso 4 · Actividades (`ActivitiesChecklistStep`)
* **Componentes:**
  * `TouchChecklist`: Lista de tareas provenientes del plan de mantenimiento con casillas de verificación de $28\times28\text{ px}$ y área táctil de fila completa. Permite añadir una observación corta opcional por ítem.
  * `TechnicalReportForm`: Formulario con autoguardado local instantáneo (`useLocalStorageDraft`) compuesto por 3 áreas de texto (`textarea`):
    1. **Diagnóstico / Estado encontrado** (Obligatorio).
    2. **Solución / Trabajos realizados** (Obligatorio).
    3. **Repuestos o materiales utilizados** (Opcional, como observación).

#### Paso 5 · Evidencias (`PhotoEvidencesStep`)
* **Componentes:**
  * `MobileCameraInput`: Botón táctil con ícono de cámara que dispara `<input type="file" accept="image/*" capture="environment" multiple />`.
  * `ClientSideImageCompressor`: Utilidad transparente que redimensiona/comprime cada fotografía en el navegador (ej. máx. $1280\text{ px}$ de lado mayor, calidad JPEG $0.75$) antes de subirla para ahorrar datos móviles y acelerar el envío.
  * `EvidenceGalleryGrid`: Cuadrícula de fotos adjuntas con opción de eliminar o escribir un pie de foto descriptivo (ej. *"Antes de limpieza de rack"*, *"Después de cambio de patch cord"*).

#### Paso 6 · Conformidad (`ClientSignOffStep`)
* **Componentes:**
  * `ReceiverDataInputs`: Campos para Nombre completo del responsable que recibe el servicio, Cargo y Documento/DNI.
  * `DigitalSignaturePad`: Lienzo HTML5 (`<canvas>`) optimizado para eventos `touchstart`, `touchmove` y `touchend` (evitando el scroll accidental de la pantalla mientras firma). Incluye botón "Limpiar firma".

#### Paso 7 · Finalización (`VisitClosureStep`)
* **Componentes:**
  * `PreSubmitValidationSummary`: Verificador visual que confirma que los ítems obligatorios del checklist, el diagnóstico/solución y la firma estén completos.
  * `CompletionOutcomeSelector`: Dos tarjetas de selección excluyentes:
    * **Trabajo Completado al 100%** (Establecerá estado `COMPLETADA`).
    * **Queda con Pendientes / Requiere Seguimiento** (Establecerá estado `CON_PENDIENTES` y habilitará un campo obligatorio para detallar qué quedó pendiente).
  * `FinalizeAndSendButton`: Botón CTA principal (`#0D6950` o `#A8262B`), detiene el cronómetro si seguía activo, registra `workEndedAt`, envía el payload completo al backend, limpia el borrador local y redirige a `Mi Agenda` mostrando confirmación de éxito.

---

## 6. Mapa de Rutas y Permisos (`AppRouter`)

| Ruta | Componente / Vista Principal | Roles Permitidos | Layout |
| :--- | :--- | :--- | :--- |
| `/login` | `LoginScreen` | Público (No autenticado) | `AuthLayout` |
| `/admin/dashboard` | `DashboardView` | `ADMIN`, `COORDINADOR`, `SUPERVISOR` | `AdminLayout` |
| `/admin/clients` | `ClientsListView` | `ADMIN`, `COORDINADOR`, `SUPERVISOR` | `AdminLayout` |
| `/admin/clients/:id` | `ClientProfileView` | `ADMIN`, `COORDINADOR`, `SUPERVISOR` | `AdminLayout` |
| `/admin/technicians` | `TechniciansView` | `ADMIN`, `COORDINADOR` | `AdminLayout` |
| `/admin/service-plans`| `ServicePlansView` | `ADMIN`, `COORDINADOR` | `AdminLayout` |
| `/admin/schedule` | `ScheduleDispatchView` | `ADMIN`, `COORDINADOR` | `AdminLayout` |
| `/admin/monitoring` | `FieldMonitoringView` | `ADMIN`, `COORDINADOR`, `SUPERVISOR` | `AdminLayout` |
| `/admin/reports` | `ReportsView` | `ADMIN`, `COORDINADOR`, `SUPERVISOR` | `AdminLayout` |
| `/field/agenda` | `MyAgendaView` | `TECNICO` | `FieldPwaLayout` |
| `/field/visits/:id` | `VisitExecutionWizardView` | `TECNICO` (Solo si `visit.technicianId === currentUser.id`) | `FieldPwaLayout` |

---

## 7. Checklist de Criterios de Aceptación para el Agente Frontend

Al construir los componentes y vistas, el agente debe garantizar que la interfaz permita demostrar sin fricción los 8 criterios de aceptación del documento funcional:

- [ ] **CA-01 (Importación sin duplicados):** El modal de importación de Excel en `/admin/clients` previsualiza los registros y bloquea o fusiona duplicados de clientes/sedes antes de confirmar.
- [ ] **CA-02 (Recurrencia idempotente):** La vista `/admin/schedule` permite generar visitas para planes quincenales y mensuales, mostrando feedback claro de que reejecutar el proceso no duplica visitas ya programadas.
- [ ] **CA-03 (Control de solapamientos y auditoría):** El selector de técnicos en `/admin/schedule` advierte visualmente cualquier cruce de horario incompatible, y toda reprogramación exige e imprime en el historial el motivo del cambio.
- [ ] **CA-04 (Aislamiento por rol en Android):** Un usuario con rol `TECNICO` es redirigido exclusivamente a `/field/agenda` y solo puede consultar e interactuar con las visitas asignadas a su propio usuario.
- [ ] **CA-05 (Flujo completo de campo):** La vista `/field/visits/:id` permite registrar de principio a fin: llegada, inicio, pausa, reanudación, fin, checklist, fotos comprimidas y firma en canvas.
- [ ] **CA-06 (Visibilidad en vivo):** Los cambios de estado y tiempos marcados en la PWA se reflejan claramente en las tarjetas y drawers de `/admin/monitoring` y `/admin/dashboard`.
- [ ] **CA-07 (Actualización de historial y reportes):** Al cerrar una visita en la PWA, la pestaña de historial en `/admin/clients/:id` y las métricas de `/admin/reports` muestran inmediatamente la atención ejecutada y sus evidencias.
- [ ] **CA-08 (Seguridad y separación de vistas):** El `RoleGuard` bloquea cualquier intento de un técnico de navegar hacia rutas `/admin/*` y viceversa.