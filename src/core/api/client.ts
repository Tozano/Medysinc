// ============================================================
// MédiSync — API Client (fetch wrapper)
// ============================================================

const API_BASE = 'http://localhost:4001/api'

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, (body as any).error ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

// ── Device ───────────────────────────────────────────────────
export const api = {
  device: {
    get: () => request<any>('/device'),
    updateSettings: (settings: { alertVolume?: number; alertLightEnabled?: boolean }) =>
      request<{ success: boolean }>('/device/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings),
      }),
  },

  compartments: {
    list: () => request<any[]>('/compartments'),
    open: (id: string) =>
      request<{ success: boolean; state: string }>(`/compartments/${id}/open`, { method: 'POST' }),
    take: (id: string) =>
      request<{ success: boolean; takenAt: string; stock: number }>(`/compartments/${id}/take`, { method: 'POST' }),
    refill: (id: string, quantity: number) =>
      request<{ success: boolean; newStock: number }>(`/compartments/${id}/refill`, {
        method: 'POST',
        body: JSON.stringify({ quantity }),
      }),
  },

  history: {
    list: (days = 7) => request<any[]>(`/history?days=${days}`),
    adherence: () => request<{ stats: any[]; adherenceRate: number }>('/history/adherence'),
  },

  alerts: {
    list: (role?: string) => request<any[]>(`/alerts${role ? `?role=${role}` : ''}`),
    markRead: (id: string) => request<{ success: boolean }>(`/alerts/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => request<{ success: boolean }>('/alerts/read-all', { method: 'PATCH' }),
    dismiss: (id: string) => request<{ success: boolean }>(`/alerts/${id}`, { method: 'DELETE' }),
  },

  patients: {
    get: (id = 'patient-1') => request<any>(`/patients/${id}`),
    renewPrescription: (patientId: string, rxId: string) =>
      request<{ success: boolean; newEndDate: string }>(
        `/patients/${patientId}/prescriptions/${rxId}/renew`,
        { method: 'PATCH' }
      ),
  },

  refills: {
    list: () => request<any[]>('/refills'),
    create: (compartments: { compartmentId: string; quantity: number }[], notes?: string) =>
      request<{ success: boolean; refillId: string }>('/refills', {
        method: 'POST',
        body: JSON.stringify({ compartments, notes }),
      }),
  },
}
