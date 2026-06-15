// ============================================================
// MédiSync — Mock Data (Realistic French Data)
// ============================================================

import {
  Alert,
  AlertSeverity,
  AlertType,
  Carer,
  Compartment,
  CompartmentState,
  Doctor,
  HistoryEntry,
  Medication,
  Patient,
  Pharmacist,
  PillboxDevice,
  Prescription,
  RefillLog,
  TimeSlot,
} from '../types'

// ── Medications ─────────────────────────────────────────────
export const mockMedications: Medication[] = [
  {
    id: 'med-1',
    name: 'Metformine',
    dosage: '500 mg',
    form: 'comprimé',
    color: '#ffffff',
    quantity: 1,
  },
  {
    id: 'med-2',
    name: 'Lisinopril',
    dosage: '10 mg',
    form: 'comprimé',
    color: '#ffd6a5',
    quantity: 1,
  },
  {
    id: 'med-3',
    name: 'Atorvastatine',
    dosage: '20 mg',
    form: 'comprimé',
    color: '#caffbf',
    quantity: 1,
  },
  {
    id: 'med-4',
    name: 'Bisoprolol',
    dosage: '5 mg',
    form: 'comprimé',
    color: '#fdffb6',
    quantity: 1,
  },
  {
    id: 'med-5',
    name: 'Vitamine D3',
    dosage: '1000 UI',
    form: 'gélule',
    color: '#ffadad',
    quantity: 1,
  },
]

// ── Actors ──────────────────────────────────────────────────
export const mockPatient: Patient = {
  id: 'patient-1',
  firstName: 'Jean',
  lastName: 'Dupont',
  age: 72,
  dateOfBirth: '1952-03-15',
  conditions: ['Diabète de type 2', 'Hypertension artérielle', 'Hypercholestérolémie'],
  doctorId: 'doctor-1',
  pharmacyId: 'pharmacy-1',
  carerId: 'carer-1',
}

export const mockDoctor: Doctor = {
  id: 'doctor-1',
  firstName: 'Marie',
  lastName: 'Leclerc',
  specialty: 'Médecine générale',
  licenseNumber: 'RPPS-10012345678',
}

export const mockPharmacist: Pharmacist = {
  id: 'pharmacy-1',
  firstName: 'Thomas',
  lastName: 'Bernard',
  pharmacyName: 'Pharmacie Centrale',
  address: '12 Rue de la République, 69001 Lyon',
}

export const mockCarer: Carer = {
  id: 'carer-1',
  firstName: 'Marie',
  lastName: 'Dupont',
  relation: 'Fille',
  phone: '06 12 34 56 78',
}

// ── Compartments (Today's View) ─────────────────────────────
const now = new Date()
const hours = now.getHours()

const getCompartmentState = (slot: TimeSlot): CompartmentState => {
  const slotHours: Record<TimeSlot, number> = {
    morning: 8,
    noon: 12,
    evening: 18,
    night: 21,
  }
  const slotHour = slotHours[slot]
  if (hours < slotHour - 1) return CompartmentState.LOCKED
  if (hours === slotHour - 1 || hours === slotHour) return CompartmentState.READY
  if (slot === 'morning' && hours >= 8 && hours < 20) return CompartmentState.TAKEN
  if (slot === 'noon' && hours >= 12 && hours < 20) return CompartmentState.TAKEN
  return CompartmentState.MISSED
}

export const mockCompartments: Compartment[] = [
  {
    id: 'comp-morning',
    slot: 'morning',
    dayOffset: 0,
    medications: [mockMedications[0], mockMedications[1]],
    scheduledTime: '08:00',
    state: hours < 7 ? CompartmentState.LOCKED : hours < 10 ? CompartmentState.READY : CompartmentState.TAKEN,
    takenAt: hours >= 10 ? new Date(new Date().setHours(8, 12)).toISOString() : undefined,
    isLocked: hours < 7,
    stock: 14,
    lowStockThreshold: 7,
  },
  {
    id: 'comp-noon',
    slot: 'noon',
    dayOffset: 0,
    medications: [mockMedications[0]],
    scheduledTime: '12:00',
    state: hours < 11 ? CompartmentState.LOCKED : hours < 14 ? CompartmentState.READY : CompartmentState.MISSED,
    isLocked: hours < 11,
    stock: 3,
    lowStockThreshold: 7,
  },
  {
    id: 'comp-evening',
    slot: 'evening',
    dayOffset: 0,
    medications: [mockMedications[1], mockMedications[2], mockMedications[3]],
    scheduledTime: '18:00',
    state: CompartmentState.READY,
    isLocked: false,
    stock: 21,
    lowStockThreshold: 7,
  },
  {
    id: 'comp-night',
    slot: 'night',
    dayOffset: 0,
    medications: [mockMedications[4]],
    scheduledTime: '21:00',
    state: CompartmentState.LOCKED,
    isLocked: true,
    stock: 28,
    lowStockThreshold: 7,
  },
]

// ── History (Last 7 Days) ────────────────────────────────────
const generateHistory = (): HistoryEntry[] => {
  const slots: TimeSlot[] = ['morning', 'noon', 'evening', 'night']
  const slotTimes: Record<TimeSlot, string> = {
    morning: '08:00',
    noon: '12:00',
    evening: '18:00',
    night: '21:00',
  }
  const slotMeds: Record<TimeSlot, Medication[]> = {
    morning: [mockMedications[0], mockMedications[1]],
    noon: [mockMedications[0]],
    evening: [mockMedications[1], mockMedications[2], mockMedications[3]],
    night: [mockMedications[4]],
  }
  // Simulate realistic adherence: ~85% compliance
  const stateDistribution = [
    CompartmentState.TAKEN,
    CompartmentState.TAKEN,
    CompartmentState.TAKEN,
    CompartmentState.TAKEN,
    CompartmentState.TAKEN,
    CompartmentState.TAKEN,
    CompartmentState.MISSED,
  ]

  const entries: HistoryEntry[] = []
  for (let day = 6; day >= 1; day--) {
    const date = new Date()
    date.setDate(date.getDate() - day)
    const dateStr = date.toISOString().split('T')[0]

    slots.forEach((slot, slotIdx) => {
      const state = stateDistribution[(day + slotIdx) % stateDistribution.length]
      const entry: HistoryEntry = {
        id: `hist-${day}-${slot}`,
        patientId: 'patient-1',
        compartmentId: `comp-${slot}`,
        slot,
        date: dateStr,
        scheduledTime: slotTimes[slot],
        state,
        medications: slotMeds[slot],
      }
      if (state === CompartmentState.TAKEN) {
        const takenDate = new Date(date)
        const [h, m] = slotTimes[slot].split(':').map(Number)
        takenDate.setHours(h + (Math.random() > 0.5 ? 0 : 1), Math.floor(Math.random() * 30))
        entry.takenAt = takenDate.toISOString()
      }
      entries.push(entry)
    })
  }
  return entries
}

export const mockHistory: HistoryEntry[] = generateHistory()

// ── Prescriptions ────────────────────────────────────────────
export const mockPrescriptions: Prescription[] = [
  {
    id: 'rx-1',
    patientId: 'patient-1',
    doctorId: 'doctor-1',
    medication: mockMedications[0],
    startDate: '2026-01-01',
    endDate: '2026-03-18',
    frequency: ['morning', 'noon'],
    renewalRequired: true,
    daysUntilExpiry: 7,
  },
  {
    id: 'rx-2',
    patientId: 'patient-1',
    doctorId: 'doctor-1',
    medication: mockMedications[1],
    startDate: '2026-01-01',
    endDate: '2026-06-01',
    frequency: ['morning', 'evening'],
    renewalRequired: false,
    daysUntilExpiry: 82,
  },
  {
    id: 'rx-3',
    patientId: 'patient-1',
    doctorId: 'doctor-1',
    medication: mockMedications[2],
    startDate: '2026-01-01',
    endDate: '2026-04-15',
    frequency: ['evening'],
    renewalRequired: false,
    daysUntilExpiry: 35,
  },
]

// ── Refill Logs ──────────────────────────────────────────────
export const mockRefillLogs: RefillLog[] = [
  {
    id: 'refill-1',
    patientId: 'patient-1',
    pharmacistId: 'pharmacy-1',
    date: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
    compartments: [
      { compartmentId: 'comp-morning', quantity: 28 },
      { compartmentId: 'comp-noon', quantity: 14 },
      { compartmentId: 'comp-evening', quantity: 28 },
      { compartmentId: 'comp-night', quantity: 28 },
    ],
    notes: 'Rechargement complet du pilulier. RAS.',
  },
]

// ── Alerts ───────────────────────────────────────────────────
export const mockAlerts: Alert[] = [
  {
    id: 'alert-1',
    type: AlertType.MISSED_DOSE,
    severity: AlertSeverity.WARNING,
    title: 'Prise oubliée',
    message: 'M. Jean Dupont n\'a pas pris son traitement du midi (Metformine 500mg). Dernière prise il y a 4h.',
    timestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    forRoles: ['patient', 'carer', 'doctor'],
    patientId: 'patient-1',
    compartmentId: 'comp-noon',
    read: false,
    actionLabel: 'Voir le pilulier',
  },
  {
    id: 'alert-2',
    type: AlertType.LOW_STOCK,
    severity: AlertSeverity.CRITICAL,
    title: 'Stock critique — Metformine midi',
    message: 'Compartiment midi : 3 comprimés restants. Rechargement nécessaire sous 3 jours.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    forRoles: ['pharmacist', 'carer'],
    patientId: 'patient-1',
    compartmentId: 'comp-noon',
    read: false,
    actionLabel: 'Recharger le pilulier',
  },
  {
    id: 'alert-3',
    type: AlertType.PRESCRIPTION_EXPIRY,
    severity: AlertSeverity.WARNING,
    title: 'Ordonnance proche de l\'expiration',
    message: 'Ordonnance Metformine 500mg expire dans 7 jours. Renouvellement requis.',
    timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    forRoles: ['doctor', 'patient'],
    patientId: 'patient-1',
    read: false,
    actionLabel: 'Renouveler l\'ordonnance',
  },
  {
    id: 'alert-4',
    type: AlertType.DOSE_READY,
    severity: AlertSeverity.INFO,
    title: 'Traitement du soir prêt',
    message: 'Votre traitement du soir est disponible. 3 médicaments à prendre.',
    timestamp: new Date().toISOString(),
    forRoles: ['patient'],
    patientId: 'patient-1',
    compartmentId: 'comp-evening',
    read: false,
    actionLabel: 'Prendre maintenant',
  },
]

// ── Pillbox Device ───────────────────────────────────────────
export const mockPillboxDevice: PillboxDevice = {
  id: 'pillbox-001',
  serialNumber: 'MS-2026-00142',
  patientId: 'patient-1',
  batteryLevel: 78,
  wifiConnected: true,
  lastSync: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  firmwareVersion: '2.4.1',
  alertVolume: 75,
  alertLightEnabled: true,
  compartments: mockCompartments,
}

// ── Adherence Stats ──────────────────────────────────────────
export const mockAdherenceData = [
  { day: 'Lun', taken: 4, missed: 0, total: 4 },
  { day: 'Mar', taken: 3, missed: 1, total: 4 },
  { day: 'Mer', taken: 4, missed: 0, total: 4 },
  { day: 'Jeu', taken: 4, missed: 0, total: 4 },
  { day: 'Ven', taken: 2, missed: 2, total: 4 },
  { day: 'Sam', taken: 4, missed: 0, total: 4 },
  { day: 'Auj', taken: 1, missed: 1, total: 4 },
]
