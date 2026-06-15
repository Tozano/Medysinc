import { Router } from 'express'
import { db } from '../db/database.js'
import { refillCompartment } from '../services/pillboxSimulator.js'

export const refillsRouter = Router()

refillsRouter.get('/', (_req, res) => {
  res.json(db.getAllRefillLogs())
})

refillsRouter.post('/', (req, res) => {
  const { compartments, notes } = req.body as {
    compartments: { compartmentId: string; quantity: number }[]
    notes?: string
  }
  if (!compartments?.length) return res.status(400).json({ error: 'compartments required' })

  const refillId = `refill-${Date.now()}`
  const now = new Date().toISOString()

  db.addRefillLog({ id: refillId, patientId: 'patient-1', pharmacistId: 'pharmacy-1', date: now, notes: notes ?? '', compartments })

  for (const item of compartments) {
    refillCompartment(item.compartmentId, item.quantity)
  }

  res.json({ success: true, refillId })
})
