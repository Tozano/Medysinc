import { Router } from 'express'
import { db } from '../db/database.js'

export const alertsRouter = Router()

alertsRouter.get('/', (req, res) => {
  const role = req.query.role as string | undefined
  res.json(db.getAlerts(role))
})

alertsRouter.patch('/read-all', (_req, res) => {
  for (const a of db.getAlerts()) {
    db.updateAlert(a.id, { read: true })
  }
  res.json({ success: true })
})

alertsRouter.patch('/:id/read', (req, res) => {
  db.updateAlert(req.params.id, { read: true })
  res.json({ success: true })
})

alertsRouter.delete('/:id', (req, res) => {
  db.deleteAlert(req.params.id)
  res.json({ success: true })
})
