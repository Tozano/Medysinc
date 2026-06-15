// ============================================================
// MédiSync Backend — Shared Types
// ============================================================

export type TimeSlot = 'morning' | 'noon' | 'evening' | 'night'

export type CompartmentState =
  | 'locked'
  | 'ready'
  | 'open'
  | 'taken'
  | 'missed'

export type AlertType =
  | 'missed_dose'
  | 'low_stock'
  | 'prescription_expiry'
  | 'dose_ready'
  | 'refill_done'

export type AlertSeverity = 'info' | 'warning' | 'critical'

// ── DB Row types (snake_case from SQLite) ─────────────────────
export interface DbPatient {
  id: string
  first_name: string
  last_name: string
  age: number
  date_of_birth: string
  conditions: string        // JSON array
  doctor_id: string
  pharmacy_id: string
  carer_id: string | null
}

export interface DbMedication {
  id: string
  name: string
  dosage: string
  form: string
  color: string
}

export interface DbCompartment {
  id: string
  device_id: string
  slot: TimeSlot
  scheduled_time: string
  state: CompartmentState
  taken_at: string | null
  is_locked: number        // SQLite boolean
  stock: number
  low_stock_threshold: number
}

export interface DbCompartmentMedication {
  compartment_id: string
  medication_id: string
  quantity: number
}

export interface DbHistory {
  id: string
  patient_id: string
  compartment_id: string
  slot: TimeSlot
  date: string
  scheduled_time: string
  taken_at: string | null
  state: CompartmentState
}

export interface DbAlert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  timestamp: string
  for_roles: string        // JSON array
  patient_id: string | null
  compartment_id: string | null
  is_read: number          // SQLite boolean
  action_label: string | null
}

export interface DbDevice {
  id: string
  serial_number: string
  patient_id: string
  battery_level: number
  wifi_connected: number
  last_sync: string
  firmware_version: string
  alert_volume: number
  alert_light_enabled: number
}

export interface DbPrescription {
  id: string
  patient_id: string
  doctor_id: string
  medication_id: string
  start_date: string
  end_date: string
  frequency: string        // JSON array of TimeSlot
  renewal_required: number
}

// ── WebSocket event types ─────────────────────────────────────
export type WsEventType =
  | 'compartment_state_changed'
  | 'alert_created'
  | 'stock_updated'
  | 'device_synced'
  | 'take_confirmed'

export interface WsEvent {
  event: WsEventType
  payload: Record<string, unknown>
  timestamp: string
}
