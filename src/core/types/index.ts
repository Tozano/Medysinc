// ============================================================
// MédiSync — Core Types
// ============================================================

export type UserRole = 'patient' | 'carer' | 'pharmacist' | 'doctor'
export type AppScene = 'hub' | 'patient' | 'carer' | 'pharmacist' | 'doctor'
export type TimeSlot = 'morning' | 'noon' | 'evening' | 'night'

export enum CompartmentState {
  LOCKED = 'locked',
  READY = 'ready',
  OPEN = 'open',
  TAKEN = 'taken',
  MISSED = 'missed',
}

export enum AlertType {
  MISSED_DOSE = 'missed_dose',
  LOW_STOCK = 'low_stock',
  PRESCRIPTION_EXPIRY = 'prescription_expiry',
  DOSE_READY = 'dose_ready',
  REFILL_DONE = 'refill_done',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

// ── Medication ──────────────────────────────────────────────
export interface Medication {
  id: string
  name: string
  dosage: string
  form: 'comprimé' | 'gélule' | 'sirop' | 'patch' | 'gouttes'
  color: string
  quantity: number
}

// ── Compartment ─────────────────────────────────────────────
export interface Compartment {
  id: string
  slot: TimeSlot
  dayOffset: number        // 0=today, 1=tomorrow, -1=yesterday
  medications: Medication[]
  scheduledTime: string    // HH:MM
  state: CompartmentState
  takenAt?: string         // ISO timestamp
  isLocked: boolean
  stock: number            // pills remaining in dispenser
  lowStockThreshold: number
}

// ── Patient ─────────────────────────────────────────────────
export interface Patient {
  id: string
  firstName: string
  lastName: string
  age: number
  dateOfBirth: string
  photo?: string
  conditions: string[]
  doctorId: string
  pharmacyId: string
  carerId?: string
}

// ── Prescription ────────────────────────────────────────────
export interface Prescription {
  id: string
  patientId: string
  doctorId: string
  medication: Medication
  startDate: string
  endDate: string
  frequency: TimeSlot[]
  renewalRequired: boolean
  daysUntilExpiry: number
}

// ── History Entry ───────────────────────────────────────────
export interface HistoryEntry {
  id: string
  patientId: string
  compartmentId: string
  slot: TimeSlot
  date: string             // YYYY-MM-DD
  scheduledTime: string
  takenAt?: string
  state: CompartmentState
  medications: Medication[]
  note?: string
}

// ── Alert ───────────────────────────────────────────────────
export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  timestamp: string
  forRoles: UserRole[]
  patientId?: string
  compartmentId?: string
  read: boolean
  actionLabel?: string
}

// ── Refill Log ──────────────────────────────────────────────
export interface RefillLog {
  id: string
  patientId: string
  pharmacistId: string
  date: string
  compartments: { compartmentId: string; quantity: number }[]
  notes: string
}

// ── Users ───────────────────────────────────────────────────
export interface Doctor {
  id: string
  firstName: string
  lastName: string
  specialty: string
  licenseNumber: string
}

export interface Pharmacist {
  id: string
  firstName: string
  lastName: string
  pharmacyName: string
  address: string
}

export interface Carer {
  id: string
  firstName: string
  lastName: string
  relation: string
  phone: string
}

// ── Pillbox Device ──────────────────────────────────────────
export interface PillboxDevice {
  id: string
  serialNumber: string
  patientId: string
  batteryLevel: number
  wifiConnected: boolean
  lastSync: string
  firmwareVersion: string
  alertVolume: number      // 0-100
  alertLightEnabled: boolean
  compartments: Compartment[]
}

// ── Store Slices ────────────────────────────────────────────
export interface AppState {
  activeScene: AppScene
  activeRole: UserRole | null
  isLoading: boolean
  alerts: Alert[]
  unreadAlertCount: number
}

export interface PillboxState {
  device: PillboxDevice
  patient: Patient
  doctor: Doctor
  pharmacist: Pharmacist
  carer: Carer
  prescriptions: Prescription[]
  history: HistoryEntry[]
  refillLogs: RefillLog[]
  isSimulationRunning: boolean
  simulationTime: Date
}
