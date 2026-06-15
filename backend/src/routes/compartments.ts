import { Router } from 'express'
import { db } from '../db/database.js'
import { openCompartment, confirmTake, refillCompartment } from '../services/pillboxSimulator.js'

export const compartmentsRouter = Router()

compartmentsRouter.get('/', (_req, res) => {
  const compartments = db.getAllCompartments().map((comp) => ({
    id: comp.id, slot: comp.slot, scheduledTime: comp.scheduledTime,
    state: comp.state, takenAt: comp.takenAt, isLocked: comp.isLocked,
    stock: comp.stock, lowStockThreshold: comp.lowStockThreshold,
    medications: db.getCompartmentMedications(comp.id),
  }))
  res.json(compartments)
})

compartmentsRouter.post('/:id/open', (req, res) => {
  const success = openCompartment(req.params.id)
  if (!success) {
    const comp = db.getCompartment(req.params.id)
    return res.status(409).json({ error: 'Cannot open', currentState: comp?.state })
  }
  res.json({ success: true, state: 'open' })
})

compartmentsRouter.post('/:id/take', (req, res) => {
  const success = confirmTake(req.params.id)
  if (!success) {
    const comp = db.getCompartment(req.params.id)
    return res.status(409).json({ error: 'Cannot confirm take', currentState: comp?.state })
  }
  const comp = db.getCompartment(req.params.id)
  res.json({ success: true, takenAt: comp.takenAt, stock: comp.stock })
})

compartmentsRouter.post('/:id/refill', (req, res) => {
  const { quantity } = req.body as { quantity: number }
  if (!quantity || quantity < 1) return res.status(400).json({ error: 'quantity >= 1 required' })
  const success = refillCompartment(req.params.id, quantity)
  if (!success) return res.status(404).json({ error: 'Compartment not found' })
  const comp = db.getCompartment(req.params.id)
  res.json({ success: true, newStock: comp.stock })
})
