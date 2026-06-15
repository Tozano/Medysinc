// ============================================================
// MédiSync — Pillbox Store (API-connected, real backend)
// ============================================================

import { create } from 'zustand'
import { api } from '../api/client'
import { HistoryEntry, RefillLog } from '../types'

interface PillboxStore {
  device: any | null
  patient: any | null
  doctor: any | null
  pharmacist: any | null
  carer: any | null
  prescriptions: any[]
  history: HistoryEntry[]
  refillLogs: RefillLog[]
  adherenceRate: number
  adherenceStats: any[]
  activeCompartmentId: string | null
  isLoading: boolean
  isConnectedToBackend: boolean
  error: string | null

  // Actions
  loadAll: () => Promise<void>
  loadDevice: () => Promise<void>
  loadHistory: () => Promise<void>
  openCompartment: (compartmentId: string) => Promise<void>
  confirmTake: (compartmentId: string) => Promise<void>
  refillCompartment: (compartmentId: string, quantity: number) => Promise<void>
  setActiveCompartment: (id: string | null) => void
  updateAlertVolume: (volume: number) => Promise<void>
  toggleAlertLight: () => Promise<void>
  renewPrescription: (rxId: string) => Promise<void>
  handleWsEvent: (event: string, payload: Record<string, unknown>) => void
}

export const usePillboxStore = create<PillboxStore>((set, get) => ({
  device: null,
  patient: null,
  doctor: null,
  pharmacist: null,
  carer: null,
  prescriptions: [],
  history: [],
  refillLogs: [],
  adherenceRate: 0,
  adherenceStats: [],
  activeCompartmentId: null,
  isLoading: false,
  isConnectedToBackend: false,
  error: null,

  loadAll: async () => {
    set({ isLoading: true, error: null })
    try {
      const [deviceData, patientData, historyData, adherenceData, refillsData] = await Promise.all([
        api.device.get(),
        api.patients.get('patient-1'),
        api.history.list(7),
        api.history.adherence(),
        api.refills.list(),
      ])
      set({
        device: deviceData,
        patient: {
          id: patientData.id,
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          age: patientData.age,
          dateOfBirth: patientData.dateOfBirth,
          conditions: patientData.conditions,
          doctorId: patientData.doctor?.id ?? '',
          pharmacyId: patientData.pharmacist?.id ?? '',
          carerId: patientData.carer?.id,
        },
        doctor: patientData.doctor ?? null,
        pharmacist: patientData.pharmacist ?? null,
        carer: patientData.carer ?? null,
        prescriptions: patientData.prescriptions ?? [],
        history: historyData,
        adherenceRate: adherenceData.adherenceRate,
        adherenceStats: adherenceData.stats,
        refillLogs: refillsData,
        isLoading: false,
        isConnectedToBackend: true,
      })
    } catch (err) {
      console.error('[Store] Failed to load from API:', err)
      set({
        isLoading: false,
        isConnectedToBackend: false,
        error: 'Impossible de contacter le backend. Lancez : cd backend && npm run dev',
      })
    }
  },

  loadDevice: async () => {
    try {
      const deviceData = await api.device.get()
      set({ device: deviceData })
    } catch { /* silent */ }
  },

  loadHistory: async () => {
    try {
      const [historyData, adherenceData] = await Promise.all([
        api.history.list(7),
        api.history.adherence(),
      ])
      set({ history: historyData, adherenceRate: adherenceData.adherenceRate, adherenceStats: adherenceData.stats })
    } catch { /* silent */ }
  },

  setActiveCompartment: (id) => set({ activeCompartmentId: id }),

  openCompartment: async (compartmentId) => {
    try {
      await api.compartments.open(compartmentId)
      set((state) => ({
        device: state.device ? {
          ...state.device,
          compartments: state.device.compartments.map((c: any) =>
            c.id === compartmentId ? { ...c, state: 'open', isLocked: false } : c
          ),
        } : null,
        activeCompartmentId: compartmentId,
      }))
    } catch (err: any) {
      console.error('[Store] openCompartment failed:', err.message)
    }
  },

  confirmTake: async (compartmentId) => {
    try {
      const result = await api.compartments.take(compartmentId)
      set((state) => ({
        device: state.device ? {
          ...state.device,
          compartments: state.device.compartments.map((c: any) =>
            c.id === compartmentId
              ? { ...c, state: 'taken', isLocked: true, takenAt: result.takenAt, stock: result.stock }
              : c
          ),
        } : null,
        activeCompartmentId: null,
      }))
      get().loadHistory()
    } catch (err: any) {
      console.error('[Store] confirmTake failed:', err.message)
    }
  },

  refillCompartment: async (compartmentId, quantity) => {
    try {
      const result = await api.compartments.refill(compartmentId, quantity)
      set((state) => ({
        device: state.device ? {
          ...state.device,
          compartments: state.device.compartments.map((c: any) =>
            c.id === compartmentId ? { ...c, stock: result.newStock } : c
          ),
        } : null,
      }))
      const refills = await api.refills.list()
      set({ refillLogs: refills })
    } catch (err: any) {
      console.error('[Store] refillCompartment failed:', err.message)
    }
  },

  updateAlertVolume: async (volume) => {
    try {
      await api.device.updateSettings({ alertVolume: volume })
      set((state) => ({ device: state.device ? { ...state.device, alertVolume: volume } : null }))
    } catch { /* silent */ }
  },

  toggleAlertLight: async () => {
    const current = get().device?.alertLightEnabled ?? true
    try {
      await api.device.updateSettings({ alertLightEnabled: !current })
      set((state) => ({ device: state.device ? { ...state.device, alertLightEnabled: !current } : null }))
    } catch { /* silent */ }
  },

  renewPrescription: async (rxId) => {
    try {
      const result = await api.patients.renewPrescription('patient-1', rxId)
      set((state) => ({
        prescriptions: state.prescriptions.map((rx: any) =>
          rx.id === rxId
            ? { ...rx, endDate: result.newEndDate, renewalRequired: false, daysUntilExpiry: 90 }
            : rx
        ),
      }))
    } catch (err: any) {
      console.error('[Store] renewPrescription failed:', err.message)
    }
  },

  handleWsEvent: (event, payload) => {
    switch (event) {
      case 'compartment_state_changed': {
        const { compartmentId, state, isLocked } = payload as any
        set((s) => ({
          device: s.device ? {
            ...s.device,
            compartments: s.device.compartments.map((c: any) =>
              c.id === compartmentId ? { ...c, state, isLocked } : c
            ),
          } : null,
        }))
        break
      }
      case 'take_confirmed': {
        const { compartmentId, takenAt, stock } = payload as any
        set((s) => ({
          device: s.device ? {
            ...s.device,
            compartments: s.device.compartments.map((c: any) =>
              c.id === compartmentId ? { ...c, state: 'taken', takenAt, stock } : c
            ),
          } : null,
        }))
        break
      }
      case 'stock_updated': {
        const { compartmentId, newStock } = payload as any
        set((s) => ({
          device: s.device ? {
            ...s.device,
            compartments: s.device.compartments.map((c: any) =>
              c.id === compartmentId ? { ...c, stock: newStock } : c
            ),
          } : null,
        }))
        break
      }
      case 'device_synced': {
        set((s) => ({
          device: s.device ? { ...s.device, lastSync: (payload as any).timestamp, wifiConnected: true } : null,
        }))
        break
      }
      case 'alert_created': {
        // Trigger reload of alerts in useAppStore
        break
      }
    }
  },
}))

// ── Selectors ─────────────────────────────────────────────────
export const selectTodayCompartments = (state: PillboxStore) =>
  state.device?.compartments ?? []

export const selectLowStockCompartments = (state: PillboxStore) =>
  (state.device?.compartments ?? []).filter((c: any) => c.stock <= c.lowStockThreshold)

export const selectAdherenceRate = (state: PillboxStore) => state.adherenceRate
