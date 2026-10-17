import type {
  Branch,
  Client,
  EnrichedVisit,
  ServicePlan,
  Technician,
  Visit,
} from '@/types/field.types';

const STORAGE_KEY = 'sumaup360-field-db-v1';

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDaysToIsoDate(baseIsoDate: string, daysToAdd: number): string {
  const [y, m, d] = baseIsoDate.split('-').map(Number);
  const date = new Date(y, (m ?? 1) - 1, (d ?? 1) + daysToAdd);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface FieldDatabaseState {
  clients: Client[];
  technicians: Technician[];
  servicePlans: ServicePlan[];
  visits: Visit[];
}

function createInitialSeed(): FieldDatabaseState {
  const today = getTodayIsoDate();
  const yesterday = addDaysToIsoDate(today, -1);
  const tomorrow = addDaysToIsoDate(today, 1);

  const clients: Client[] = [
    {
      id: 'cli-01',
      ruc: '20548912301',
      businessName: 'Corporación Financiera Andina S.A.A.',
      status: 'ACTIVO',
      createdAt: '2025-01-15T10:00:00.000Z',
      branches: [
        {
          id: 'br-01',
          clientId: 'cli-01',
          name: 'Sede Central San Isidro',
          address: 'Av. República de Panamá 3420, San Isidro',
          zone: 'San Isidro',
          contactName: 'Ing. Ricardo Montalvo',
          contactPhone: '+51 998 412 310',
          contactEmail: 'r.montalvo@finandina.pe',
          coordinates: { lat: -12.0964, lng: -77.0247 },
        },
        {
          id: 'br-02',
          clientId: 'cli-01',
          name: 'Agencia Empresarial Miraflores',
          address: 'Av. José Larco 1150, Miraflores',
          zone: 'Miraflores',
          contactName: 'Lic. Claudia Benavides',
          contactPhone: '+51 987 620 114',
          contactEmail: 'c.benavides@finandina.pe',
          coordinates: { lat: -12.1292, lng: -77.0299 },
        },
      ],
    },
    {
      id: 'cli-02',
      ruc: '20601948275',
      businessName: 'Terminales Logísticos del Pacífico S.A.C.',
      status: 'ACTIVO',
      createdAt: '2025-02-10T09:30:00.000Z',
      branches: [
        {
          id: 'br-03',
          clientId: 'cli-02',
          name: 'Hub Portuario Callao',
          address: 'Av. Néstor Gambetta Km 8.5, Callao',
          zone: 'Callao',
          contactName: 'Ing. Jorge Zambrano',
          contactPhone: '+51 991 304 882',
          contactEmail: 'j.zambrano@tlpacifico.com.pe',
          coordinates: { lat: -11.9942, lng: -77.1271 },
        },
        {
          id: 'br-04',
          clientId: 'cli-02',
          name: 'Planta Industrial Ate',
          address: 'Av. Nicolás Ayllón 4810, Ate',
          zone: 'Ate Industrial',
          contactName: 'Ing. Elena Quiroz',
          contactPhone: '+51 994 510 229',
          contactEmail: 'e.quiroz@tlpacifico.com.pe',
          coordinates: { lat: -12.0432, lng: -76.9421 },
        },
      ],
    },
    {
      id: 'cli-03',
      ruc: '20517384920',
      businessName: 'Clínica Médica San Borja Sur S.A.',
      status: 'ACTIVO',
      createdAt: '2025-03-04T15:10:00.000Z',
      branches: [
        {
          id: 'br-05',
          clientId: 'cli-03',
          name: 'Torre Hospitalaria Principal',
          address: 'Av. Guardia Civil 680, San Borja',
          zone: 'San Borja',
          contactName: 'Ing. Marcos Paredes',
          contactPhone: '+51 982 119 450',
          contactEmail: 'm.paredes@clinicasbs.pe',
          coordinates: { lat: -12.0941, lng: -77.0052 },
        },
      ],
    },
    {
      id: 'cli-04',
      ruc: '20593018472',
      businessName: 'Industrias Metalmecánicas Surco S.A.C.',
      status: 'INACTIVO',
      createdAt: '2025-04-19T11:45:00.000Z',
      branches: [
        {
          id: 'br-06',
          clientId: 'cli-04',
          name: 'Centro de Operaciones Surco',
          address: 'Av. Caminos del Inca 1840, Santiago de Surco',
          zone: 'Surco',
          contactName: 'Sr. Héctor Olivares',
          contactPhone: '+51 975 330 912',
          coordinates: { lat: -12.1268, lng: -76.9891 },
        },
      ],
    },
  ];

  const technicians: Technician[] = [
    {
      id: 'tech-01',
      userId: 'usr-tech-01',
      fullName: 'Marco Antonio Quispe',
      email: 'tecnico@demo.com',
      phone: '+51 986 240 119',
      specialties: ['Servidores', 'Redes', 'UPS Industrial'],
      assignedZones: ['San Isidro', 'Miraflores', 'San Borja'],
      workSchedule: {
        days: [1, 2, 3, 4, 5, 6],
        startTime: '08:00',
        endTime: '18:00',
      },
      isActive: true,
    },
    {
      id: 'tech-02',
      userId: 'usr-tech-02',
      fullName: 'Luis Fernando Cáceres',
      email: 'l.caceres@electronicaymas.pe',
      phone: '+51 992 841 705',
      specialties: ['CCTV', 'Control de Acceso', 'Fibra Óptica'],
      assignedZones: ['Callao', 'San Isidro', 'Miraflores'],
      workSchedule: {
        days: [1, 2, 3, 4, 5, 6],
        startTime: '08:30',
        endTime: '18:00',
      },
      isActive: true,
    },
    {
      id: 'tech-03',
      userId: 'usr-tech-03',
      fullName: 'Renato Gómez Huamán',
      email: 'r.gomez@electronicaymas.pe',
      phone: '+51 974 115 802',
      specialties: ['UPS Industrial', 'Tableros Eléctricos', 'Servidores'],
      assignedZones: ['Ate Industrial', 'San Borja', 'Surco'],
      workSchedule: {
        days: [1, 2, 3, 4, 5],
        startTime: '08:00',
        endTime: '17:30',
      },
      isActive: true,
    },
    {
      id: 'tech-04',
      userId: 'usr-tech-04',
      fullName: 'Ernesto Vargas Chávez',
      email: 'e.vargas@electronicaymas.pe',
      phone: '+51 961 440 218',
      specialties: ['Redes', 'CCTV'],
      assignedZones: ['Surco', 'Miraflores'],
      workSchedule: {
        days: [1, 2, 3, 4, 5],
        startTime: '09:00',
        endTime: '18:00',
      },
      isActive: false,
    },
  ];

  const servicePlans: ServicePlan[] = [
    {
      id: 'plan-01',
      clientId: 'cli-01',
      branchId: 'br-01',
      title: 'Mantenimiento Preventivo Data Center & Bancos UPS 40kVA',
      requiredSpecialty: 'UPS Industrial',
      frequency: 'MENSUAL',
      startDate: today,
      estimatedDurationMinutes: 120,
      isActive: true,
      checklistTemplate: [
        {
          id: 'chk-101',
          label: 'Medición de voltaje DC en banco de baterías (Nominal 240V DC)',
          isRequired: true,
        },
        {
          id: 'chk-102',
          label: 'Inspección termográfica de bornes y contactores principales',
          isRequired: true,
        },
        {
          id: 'chk-103',
          label: 'Prueba de transferencia controlada a modo Bypass e Inversor',
          isRequired: true,
        },
        {
          id: 'chk-104',
          label: 'Limpieza de filtros de aire y ventiladores extractores',
          isRequired: false,
        },
      ],
    },
    {
      id: 'plan-02',
      clientId: 'cli-02',
      branchId: 'br-03',
      title: 'Revisión Quincenal de Domos PTZ Perimetrales y NVR',
      requiredSpecialty: 'CCTV',
      frequency: 'QUINCENAL',
      startDate: today,
      estimatedDurationMinutes: 90,
      isActive: true,
      checklistTemplate: [
        {
          id: 'chk-201',
          label: 'Verificación de grabación continua en arreglo RAID-5 del NVR',
          isRequired: true,
        },
        {
          id: 'chk-202',
          label: 'Limpieza óptica de domos PTZ y prueba de presets de patrullaje',
          isRequired: true,
        },
        {
          id: 'chk-203',
          label: 'Comprobación de fuentes PoE+ 48V en switches industriales',
          isRequired: true,
        },
      ],
    },
    {
      id: 'plan-03',
      clientId: 'cli-03',
      branchId: 'br-05',
      title: 'Certificación Mensual de Core de Redes y Gabinetes Clínicos',
      requiredSpecialty: 'Redes',
      frequency: 'MENSUAL',
      startDate: today,
      estimatedDurationMinutes: 90,
      isActive: true,
      checklistTemplate: [
        {
          id: 'chk-301',
          label: 'Revisión de enlaces troncales de fibra óptica y atenuación dBm',
          isRequired: true,
        },
        {
          id: 'chk-302',
          label: 'Respaldo de configuración de switches Core y Firewall redundante',
          isRequired: true,
        },
        {
          id: 'chk-303',
          label: 'Peinado de patch cords y etiquetado normativo TIA/EIA-606',
          isRequired: false,
        },
      ],
    },
  ];

  const visits: Visit[] = [
    {
      id: 'vis-101',
      code: 'VIS-2026-0101',
      planId: 'plan-01',
      title: 'Mantenimiento Preventivo Data Center & Bancos UPS 40kVA',
      requiredSpecialty: 'UPS Industrial',
      estimatedDurationMinutes: 120,
      clientId: 'cli-01',
      branchId: 'br-01',
      technicianId: 'tech-01',
      scheduledDate: today,
      scheduledStartTime: '09:00',
      scheduledEndTime: '11:00',
      status: 'EN_CURSO',
      rescheduleHistory: [],
      execution: {
        transitStartedAt: `${today}T08:15:00.000Z`,
        arrivedAt: `${today}T08:52:00.000Z`,
        checkInCoordinates: {
          lat: -12.0964,
          lng: -77.0247,
          accuracy: 12,
        },
        workStartedAt: `${today}T09:00:00.000Z`,
        pauses: [],
        effectiveWorkSeconds: 4320,
        transitSeconds: 2220,
        checklistResults: [
          {
            itemId: 'chk-101',
            label: 'Medición de voltaje DC en banco de baterías (Nominal 240V DC)',
            isRequired: true,
            completed: true,
            note: 'Lectura estable en 241.4V DC',
          },
          {
            itemId: 'chk-102',
            label: 'Inspección termográfica de bornes y contactores principales',
            isRequired: true,
            completed: true,
            note: 'Temperatura máxima 34.2°C dentro de rango',
          },
          {
            itemId: 'chk-103',
            label: 'Prueba de transferencia controlada a modo Bypass e Inversor',
            isRequired: true,
            completed: false,
          },
          {
            itemId: 'chk-104',
            label: 'Limpieza de filtros de aire y ventiladores extractores',
            isRequired: false,
            completed: false,
          },
        ],
        diagnostics:
          'Banco de baterías principal operativo al 96% de capacidad. Se detecta acumulación leve de polvo en rejillas de ventilación.',
        solutionApplied:
          'Ajuste de torque en barraje DC y calibración de alarmas SNMP.',
        sparePartsUsed: '2x Fusibles de control ultrarrápidos 10A',
        evidences: [],
        hasPendingIssues: false,
      },
    },
    {
      id: 'vis-102',
      code: 'VIS-2026-0102',
      planId: 'plan-03',
      title: 'Certificación Mensual de Core de Redes y Gabinetes Clínicos',
      requiredSpecialty: 'Redes',
      estimatedDurationMinutes: 90,
      clientId: 'cli-03',
      branchId: 'br-05',
      technicianId: 'tech-01',
      scheduledDate: today,
      scheduledStartTime: '14:30',
      scheduledEndTime: '16:00',
      status: 'PROGRAMADA',
      rescheduleHistory: [],
      execution: {
        pauses: [],
        effectiveWorkSeconds: 0,
        transitSeconds: 0,
        checklistResults: [
          {
            itemId: 'chk-301',
            label: 'Revisión de enlaces troncales de fibra óptica y atenuación dBm',
            isRequired: true,
            completed: false,
          },
          {
            itemId: 'chk-302',
            label: 'Respaldo de configuración de switches Core y Firewall redundante',
            isRequired: true,
            completed: false,
          },
          {
            itemId: 'chk-303',
            label: 'Peinado de patch cords y etiquetado normativo TIA/EIA-606',
            isRequired: false,
            completed: false,
          },
        ],
        diagnostics: '',
        solutionApplied: '',
        evidences: [],
        hasPendingIssues: false,
      },
    },
    {
      id: 'vis-103',
      code: 'VIS-2026-0103',
      planId: 'plan-02',
      title: 'Revisión Quincenal de Domos PTZ Perimetrales y NVR',
      requiredSpecialty: 'CCTV',
      estimatedDurationMinutes: 90,
      clientId: 'cli-02',
      branchId: 'br-03',
      technicianId: 'tech-02',
      scheduledDate: today,
      scheduledStartTime: '10:00',
      scheduledEndTime: '11:30',
      status: 'EN_TRASLADO',
      rescheduleHistory: [],
      execution: {
        transitStartedAt: `${today}T09:20:00.000Z`,
        pauses: [],
        effectiveWorkSeconds: 0,
        transitSeconds: 1800,
        checklistResults: [
          {
            itemId: 'chk-201',
            label: 'Verificación de grabación continua en arreglo RAID-5 del NVR',
            isRequired: true,
            completed: false,
          },
          {
            itemId: 'chk-202',
            label: 'Limpieza óptica de domos PTZ y prueba de presets de patrullaje',
            isRequired: true,
            completed: false,
          },
          {
            itemId: 'chk-203',
            label: 'Comprobación de fuentes PoE+ 48V en switches industriales',
            isRequired: true,
            completed: false,
          },
        ],
        diagnostics: '',
        solutionApplied: '',
        evidences: [],
        hasPendingIssues: false,
      },
    },
    {
      id: 'vis-104',
      code: 'VIS-2026-0104',
      title: 'Inspección de Tablero de Transferencia Automática ATS',
      requiredSpecialty: 'UPS Industrial',
      estimatedDurationMinutes: 90,
      clientId: 'cli-02',
      branchId: 'br-04',
      technicianId: 'tech-03',
      scheduledDate: today,
      scheduledStartTime: '08:30',
      scheduledEndTime: '10:00',
      status: 'CON_PENDIENTES',
      rescheduleHistory: [],
      execution: {
        transitStartedAt: `${today}T07:50:00.000Z`,
        arrivedAt: `${today}T08:25:00.000Z`,
        checkInCoordinates: {
          lat: -12.0432,
          lng: -76.9421,
          accuracy: 9,
        },
        workStartedAt: `${today}T08:30:00.000Z`,
        workEndedAt: `${today}T10:05:00.000Z`,
        pauses: [],
        effectiveWorkSeconds: 5700,
        transitSeconds: 2100,
        checklistResults: [
          {
            itemId: 'chk-401',
            label: 'Verificación de relé supervisor de fases R-S-T',
            isRequired: true,
            completed: true,
            note: 'Relé presenta descalibración en fase T',
          },
          {
            itemId: 'chk-402',
            label: 'Simulación de corte de red comercial con grupo electrógeno',
            isRequired: true,
            completed: true,
          },
        ],
        diagnostics:
          'Se identificó desgaste térmico en el contactor auxiliar K2 del módulo ATS de 250A.',
        solutionApplied:
          'Se realizó limpieza dieléctrica y ajuste provisional seguro. Requiere cambio de contactor K2.',
        sparePartsUsed: 'Spray dieléctrico 3M, terminales tipo pin',
        evidences: [],
        signOff: {
          receiverName: 'Ing. Elena Quiroz',
          receiverRole: 'Jefa de Mantenimiento de Planta',
          receiverDocument: '43891024',
          signatureDataUrl:
            'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="260" height="80"%3E%3Cpath d="M20 55 C 60 15, 90 65, 130 35 C 160 20, 200 50, 240 30" stroke="%231F2926" stroke-width="2.5" fill="none"/%3E%3C/svg%3E',
          signedAt: `${today}T10:04:00.000Z`,
        },
        hasPendingIssues: true,
        pendingIssuesDescription:
          'Cotizar y programar reemplazo de contactor auxiliar tetrapolar K2 250A en los próximos 5 días hábiles.',
        supervisorReviewed: false,
      },
    },
    {
      id: 'vis-105',
      code: 'VIS-2026-0105',
      title: 'Auditoría de Enlaces Redundantes y Switch PoE Miraflores',
      requiredSpecialty: 'Redes',
      estimatedDurationMinutes: 60,
      clientId: 'cli-01',
      branchId: 'br-02',
      technicianId: 'tech-01',
      scheduledDate: today,
      scheduledStartTime: '07:30',
      scheduledEndTime: '08:15',
      status: 'COMPLETADA',
      rescheduleHistory: [],
      execution: {
        transitStartedAt: `${today}T07:00:00.000Z`,
        arrivedAt: `${today}T07:25:00.000Z`,
        checkInCoordinates: {
          lat: -12.1292,
          lng: -77.0299,
          accuracy: 8,
        },
        workStartedAt: `${today}T07:30:00.000Z`,
        workEndedAt: `${today}T08:12:00.000Z`,
        pauses: [],
        effectiveWorkSeconds: 2520,
        transitSeconds: 1500,
        checklistResults: [
          {
            itemId: 'chk-501',
            label: 'Test de failover automático entre fibra primaria y radioenlace',
            isRequired: true,
            completed: true,
            note: 'Conmutación en 18ms sin pérdida de sesión',
          },
          {
            itemId: 'chk-502',
            label: 'Verificación de carga PoE en puntos de acceso Wi-Fi 6',
            isRequired: true,
            completed: true,
          },
        ],
        diagnostics: 'Switch de distribución operando en parámetros óptimos.',
        solutionApplied:
          'Actualización de firmware de seguridad y limpieza de gabinete mural.',
        evidences: [],
        signOff: {
          receiverName: 'Lic. Claudia Benavides',
          receiverRole: 'Administradora de Agencia',
          receiverDocument: '41209844',
          signatureDataUrl:
            'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="260" height="80"%3E%3Cpath d="M30 50 Q 80 15, 120 48 T 220 35" stroke="%230D6950" stroke-width="2.5" fill="none"/%3E%3C/svg%3E',
          signedAt: `${today}T08:11:00.000Z`,
        },
        hasPendingIssues: false,
        supervisorReviewed: true,
      },
    },
    {
      id: 'vis-106',
      code: 'VIS-2026-0106',
      title: 'Calibración de Sensores de Humedad y Temperatura en Racks',
      requiredSpecialty: 'Servidores',
      estimatedDurationMinutes: 90,
      clientId: 'cli-01',
      branchId: 'br-02',
      scheduledDate: today,
      status: 'POR_PROGRAMAR',
      rescheduleHistory: [],
    },
    {
      id: 'vis-107',
      code: 'VIS-2026-0107',
      title: 'Mantenimiento Preventivo de Cámaras Térmicas Almacén 2',
      requiredSpecialty: 'CCTV',
      estimatedDurationMinutes: 120,
      clientId: 'cli-02',
      branchId: 'br-04',
      technicianId: 'tech-02',
      scheduledDate: yesterday,
      scheduledStartTime: '15:00',
      scheduledEndTime: '17:00',
      status: 'VENCIDA',
      rescheduleHistory: [],
    },
    {
      id: 'vis-108',
      code: 'VIS-2026-0108',
      planId: 'plan-01',
      title: 'Revisión Preventiva de Banco de Condensadores y UPS Auxiliar',
      requiredSpecialty: 'UPS Industrial',
      estimatedDurationMinutes: 90,
      clientId: 'cli-03',
      branchId: 'br-05',
      technicianId: 'tech-01',
      scheduledDate: tomorrow,
      scheduledStartTime: '09:30',
      scheduledEndTime: '11:00',
      status: 'PROGRAMADA',
      rescheduleHistory: [],
    },
  ];

  return {
    clients,
    technicians,
    servicePlans,
    visits,
  };
}

class FieldMockDatabase {
  private state: FieldDatabaseState;

  constructor() {
    this.state = this.loadFromStorage();
  }

  private loadFromStorage(): FieldDatabaseState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as FieldDatabaseState;
      }
    } catch {
      // Fallback to seed if storage is unavailable
    }
    const seed = createInitialSeed();
    this.saveToStorage(seed);
    return seed;
  }

  private saveToStorage(nextState: FieldDatabaseState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // Ignore quota errors
    }
  }

  public getState(): FieldDatabaseState {
    return this.state;
  }

  public updateState(
    updater: (prev: FieldDatabaseState) => FieldDatabaseState
  ): FieldDatabaseState {
    this.state = updater(this.state);
    this.saveToStorage(this.state);
    return this.state;
  }

  public resetToSeed(): FieldDatabaseState {
    const seed = createInitialSeed();
    this.state = seed;
    this.saveToStorage(seed);
    return seed;
  }

  public enrichVisit(visit: Visit): EnrichedVisit {
    const client = this.state.clients.find((c) => c.id === visit.clientId);
    const branch: Branch | undefined = client?.branches.find(
      (b) => b.id === visit.branchId
    );
    const technician = this.state.technicians.find(
      (t) => t.id === visit.technicianId
    );

    return {
      ...visit,
      clientName: client?.businessName ?? 'Cliente No Registrado',
      clientRuc: client?.ruc ?? '00000000000',
      branchName: branch?.name ?? 'Sede Principal',
      branchAddress: branch?.address ?? 'Dirección por confirmar',
      branchZone: branch?.zone ?? 'Lima Metropolitana',
      branchContactName: branch?.contactName ?? 'Contacto de Sede',
      branchContactPhone: branch?.contactPhone ?? '+51 999 000 000',
      branchCoordinates: branch?.coordinates,
      technicianName: technician?.fullName,
      technicianPhone: technician?.phone,
    };
  }

  public getEnrichedVisits(): EnrichedVisit[] {
    return this.state.visits.map((v) => this.enrichVisit(v));
  }
}

export const fieldMockDb = new FieldMockDatabase();
