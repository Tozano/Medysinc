// ============================================================
// MédiSync — App Store (Navigation & Global UI State)
// ============================================================

import { create } from 'zustand'
import { Alert, AppScene, UserRole } from '../types'
import { api } from '../api/client'

interface AppStore {
  activeScene: AppScene
  activeRole: UserRole | null
  alerts: Alert[]
  isSidebarOpen: boolean

  // Actions
  navigateTo: (scene: AppScene, role?: UserRole) => void
  goToHub: () => void
  loadAlerts: (role?: UserRole) => Promise<void>
  markAlertRead: (alertId: string) => void
  markAllAlertsRead: () => void
  addAlert: (alert: Alert) => void
  dismissAlert: (alertId: string) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  activeScene: 'hub',
  activeRole: null,
  alerts: [],
  isSidebarOpen: false,

  navigateTo: (scene, role) =>
    set({ activeScene: scene, activeRole: role ?? null }),

  goToHub: () =>
    set({ activeScene: 'hub', activeRole: null }),

  loadAlerts: async (role?: UserRole) => {
    try {
      const data = await api.alerts.list(role)
      set({ alerts: data })
    } catch {
      // silently fail — backend may not be up yet
    }
  },

  markAlertRead: (alertId) => {
    api.alerts.markRead(alertId).catch(() => {})
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, read: true } : a
      ),
    }))
  },

  markAllAlertsRead: () => {
    api.alerts.markAllRead().catch(() => {})
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, read: true })),
    }))
  },

  addAlert: (alert) =>
    set((state) => ({ alerts: [alert, ...state.alerts] })),

  dismissAlert: (alertId) => {
    api.alerts.dismiss(alertId).catch(() => {})
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== alertId),
    }))
  },

  toggleSidebar: () =>
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}))

// Derived selectors
export const selectUnreadAlerts = (state: AppStore) =>
  state.alerts.filter((a) => !a.read)

export const selectAlertsForRole = (role: UserRole) => (state: AppStore) =>
  state.alerts.filter((a) => a.forRoles.includes(role))
