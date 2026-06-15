// ============================================================
// MédiSync — Pill Dispenser Simulator
// Simulates Arduino device behavior server-side:
//   - Auto-transitions compartment states based on real time
//   - Fires alerts for missed doses + low stock
//   - Broadcasts WebSocket events to all clients
// ============================================================

import { db } from '../db/database.js'
import { broadcast } from '../ws.js'

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function nowMinutes(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export function simulatorTick() {
  const nowMin = nowMinutes()
  const today = new Date().toISOString().split('T')[0]
  const compartments = db.getAllCompartments()

  for (const comp of compartments) {
    const scheduledMin = timeToMinutes(comp.scheduledTime)
    const readyAt  = scheduledMin - 30
    const missedAt = scheduledMin + 45

    if (comp.state === 'taken' || comp.state === 'missed') continue

    if (comp.state === 'locked' && nowMin >= readyAt && nowMin < missedAt) {
      setCompartmentState(comp.id, 'ready', false)
      createAlert({
        type: 'dose_ready', severity: 'info',
        title: `Traitement ${slotLabel(comp.slot)} disponible`,
        message: `Votre traitement de ${slotLabel(comp.slot)} est prêt à ${comp.scheduledTime}.`,
        forRoles: ['patient'], compartmentId: comp.id,
      })
      continue
    }

    if ((comp.state === 'ready' || comp.state === 'open') && nowMin > missedAt) {
      setCompartmentState(comp.id, 'missed', true)
      if (!db.getHistoryByCompartmentDate(comp.id, today)) {
        db.addHistory({
          id: `hist-${Date.now()}-${comp.slot}`,
          patientId: 'patient-1', compartmentId: comp.id, slot: comp.slot,
          date: today, scheduledTime: comp.scheduledTime, takenAt: null, state: 'missed',
        })
      }
      createAlert({
        type: 'missed_dose', severity: 'warning',
        title: 'Prise oubliée',
        message: `Traitement du ${slotLabel(comp.slot)} (${comp.scheduledTime}) non effectué.`,
        forRoles: ['patient', 'carer', 'doctor'], compartmentId: comp.id,
      })
    }
  }

  checkLowStock()
  db.updateDevice('device-001', { lastSync: new Date().toISOString() })
  broadcast({
    event: 'device_synced',
    payload: { deviceId: 'device-001', timestamp: new Date().toISOString() },
    timestamp: new Date().toISOString(),
  })
}

export function setCompartmentState(id: string, state: string, isLocked: boolean) {
  db.updateCompartment(id, { state, isLocked })
  const comp = db.getCompartment(id)
  broadcast({
    event: 'compartment_state_changed',
    payload: { compartmentId: id, state, isLocked, slot: comp?.slot },
    timestamp: new Date().toISOString(),
  })
  console.log(`[Simulator] ${id} → ${state}`)
}

export function openCompartment(id: string): boolean {
  const comp = db.getCompartment(id)
  if (!comp || comp.state !== 'ready') return false
  setCompartmentState(id, 'open', false)
  return true
}

export function confirmTake(id: string): boolean {
  const comp = db.getCompartment(id)
  if (!comp || (comp.state !== 'open' && comp.state !== 'ready')) return false

  const takenAt = new Date().toISOString()
  const today = takenAt.split('T')[0]
  const newStock = Math.max(0, comp.stock - 1)

  db.updateCompartment(id, { state: 'taken', isLocked: true, takenAt, stock: newStock })

  const existing = db.getHistoryByCompartmentDate(id, today)
  if (!existing) {
    db.addHistory({
      id: `hist-${Date.now()}-${comp.slot}`,
      patientId: 'patient-1', compartmentId: id, slot: comp.slot,
      date: today, scheduledTime: comp.scheduledTime, takenAt, state: 'taken',
    })
  } else {
    db.updateHistory(existing.id, { takenAt, state: 'taken' })
  }

  broadcast({
    event: 'take_confirmed',
    payload: { compartmentId: id, takenAt, slot: comp.slot, stock: newStock },
    timestamp: takenAt,
  })

  if (newStock <= comp.lowStockThreshold) {
    createAlert({
      type: 'low_stock',
      severity: newStock === 0 ? 'critical' : 'warning',
      title: `Stock faible — ${slotLabel(comp.slot)}`,
      message: `Compartiment ${slotLabel(comp.slot)} : ${newStock} unité${newStock !== 1 ? 's' : ''} restante${newStock !== 1 ? 's' : ''}.`,
      forRoles: ['pharmacist', 'carer'], compartmentId: id,
    })
  }
  console.log(`[Simulator] ✓ Take confirmed: ${id}`)
  return true
}

export function refillCompartment(id: string, quantity: number): boolean {
  const comp = db.getCompartment(id)
  if (!comp) return false
  const newStock = comp.stock + quantity
  db.updateCompartment(id, { stock: newStock })
  broadcast({
    event: 'stock_updated',
    payload: { compartmentId: id, newStock, addedQuantity: quantity },
    timestamp: new Date().toISOString(),
  })
  console.log(`[Simulator] Refilled ${id}: +${quantity} → ${newStock}`)
  return true
}

function createAlert({ type, severity, title, message, forRoles, compartmentId }: {
  type: string; severity: string; title: string; message: string
  forRoles: string[]; compartmentId?: string
}) {
  if (db.hasRecentAlert(type, compartmentId ?? null, 3_600_000)) return
  const id = `alert-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const timestamp = new Date().toISOString()
  db.addAlert({
    id, type, severity, title, message, timestamp,
    forRoles, patientId: 'patient-1',
    compartmentId: compartmentId ?? null, read: false, actionLabel: null,
  })
  broadcast({
    event: 'alert_created',
    payload: { id, type, severity, title, message, forRoles, timestamp },
    timestamp,
  })
  console.log(`[Alert] ${severity.toUpperCase()} — ${title}`)
}

function checkLowStock() {
  for (const comp of db.getAllCompartments()) {
    if (comp.stock <= comp.lowStockThreshold) {
      createAlert({
        type: 'low_stock',
        severity: comp.stock === 0 ? 'critical' : 'warning',
        title: `Stock faible — ${slotLabel(comp.slot)}`,
        message: `Compartiment ${slotLabel(comp.slot)} : ${comp.stock} unités restantes.`,
        forRoles: ['pharmacist', 'carer'], compartmentId: comp.id,
      })
    }
  }
}

function slotLabel(slot: string): string {
  return ({ morning: 'matin', noon: 'midi', evening: 'soir', night: 'nuit' } as any)[slot] ?? slot
}

let interval: ReturnType<typeof setInterval> | null = null

export function startSimulator() {
  if (interval) return
  console.log('[Simulator] Started (tick every 30s)')
  simulatorTick()
  interval = setInterval(simulatorTick, 30_000)
}

export function stopSimulator() {
  if (interval) { clearInterval(interval); interval = null }
}
