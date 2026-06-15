// ============================================================
// MédiSync — JSON Store (zero native deps, file-persisted)
// Simulates a database with in-memory objects + JSON persistence
// Production equivalent: Spring Boot + PostgreSQL
// ============================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '../../data')
const DB_FILE = join(DATA_DIR, 'medisync.json')

mkdirSync(DATA_DIR, { recursive: true })

// ── Data Shape ────────────────────────────────────────────────
export interface DbStore {
  doctors: Record<string, any>
  pharmacists: Record<string, any>
  carers: Record<string, any>
  patients: Record<string, any>
  medications: Record<string, any>
  devices: Record<string, any>
  compartments: Record<string, any>
  compartmentMedications: Array<{ compartmentId: string; medicationId: string; quantity: number }>
  prescriptions: Record<string, any>
  history: Record<string, any>
  alerts: Record<string, any>
  refillLogs: Record<string, any>
}

let store: DbStore = {
  doctors: {}, pharmacists: {}, carers: {}, patients: {},
  medications: {}, devices: {}, compartments: {},
  compartmentMedications: [],
  prescriptions: {}, history: {}, alerts: {}, refillLogs: {},
}

export function loadDb(): void {
  if (existsSync(DB_FILE)) {
    try {
      store = JSON.parse(readFileSync(DB_FILE, 'utf-8'))
      console.log('[DB] Loaded from', DB_FILE)
    } catch {
      console.warn('[DB] Corrupt DB file — starting fresh')
    }
  }
}

export function saveDb(): void {
  writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8')
}

export function isSeeded(): boolean {
  return Object.keys(store.patients).length > 0
}

// ── Typed query helpers (mirror a SQL ORM interface) ─────────
export const db = {
  get store() { return store },

  getPatient: (id: string) => store.patients[id],
  getDoctor: (id: string) => store.doctors[id],
  getPharmacist: (id: string) => store.pharmacists[id],
  getCarer: (id: string) => store.carers[id],

  getDevice: (id: string) => store.devices[id],
  updateDevice: (id: string, patch: Record<string, any>) => {
    store.devices[id] = { ...store.devices[id], ...patch }
    saveDb()
  },

  getCompartment: (id: string) => store.compartments[id],
  getAllCompartments: () => Object.values(store.compartments) as any[],
  getDeviceCompartments: (deviceId: string) =>
    (Object.values(store.compartments) as any[]).filter((c) => c.deviceId === deviceId),
  updateCompartment: (id: string, patch: Record<string, any>) => {
    store.compartments[id] = { ...store.compartments[id], ...patch }
    saveDb()
  },
  getCompartmentMedications: (compartmentId: string) =>
    store.compartmentMedications
      .filter((cm) => cm.compartmentId === compartmentId)
      .map((cm) => ({ ...store.medications[cm.medicationId], quantity: cm.quantity })),

  getPatientPrescriptions: (patientId: string) =>
    (Object.values(store.prescriptions) as any[]).filter((p) => p.patientId === patientId),
  updatePrescription: (id: string, patch: Record<string, any>) => {
    store.prescriptions[id] = { ...store.prescriptions[id], ...patch }
    saveDb()
  },

  getHistory: (days = 7) => {
    const since = new Date()
    since.setDate(since.getDate() - days)
    const sinceStr = since.toISOString().split('T')[0]
    return (Object.values(store.history) as any[])
      .filter((h) => h.date >= sinceStr)
      .sort((a, b) => b.date.localeCompare(a.date) || b.scheduledTime.localeCompare(a.scheduledTime))
  },
  getHistoryByCompartmentDate: (compartmentId: string, date: string) =>
    (Object.values(store.history) as any[]).find(
      (h) => h.compartmentId === compartmentId && h.date === date
    ),
  addHistory: (entry: any) => { store.history[entry.id] = entry; saveDb() },
  updateHistory: (id: string, patch: Record<string, any>) => {
    if (store.history[id]) { store.history[id] = { ...store.history[id], ...patch }; saveDb() }
  },

  getAlerts: (role?: string) => {
    const all = (Object.values(store.alerts) as any[])
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    return role ? all.filter((a) => a.forRoles.includes(role)) : all
  },
  addAlert: (alert: any) => { store.alerts[alert.id] = alert; saveDb() },
  updateAlert: (id: string, patch: Record<string, any>) => {
    if (store.alerts[id]) { store.alerts[id] = { ...store.alerts[id], ...patch }; saveDb() }
  },
  deleteAlert: (id: string) => { delete store.alerts[id]; saveDb() },
  hasRecentAlert: (type: string, compartmentId: string | null, withinMs: number) => {
    const cutoff = new Date(Date.now() - withinMs).toISOString()
    return (Object.values(store.alerts) as any[]).some(
      (a) => a.type === type && a.compartmentId === compartmentId && a.timestamp > cutoff
    )
  },

  getAllRefillLogs: () =>
    (Object.values(store.refillLogs) as any[]).sort((a, b) => b.date.localeCompare(a.date)),
  addRefillLog: (log: any) => { store.refillLogs[log.id] = log; saveDb() },
}
