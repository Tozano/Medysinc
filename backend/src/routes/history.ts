import { Router } from 'express'
import { db } from '../db/database.js'

export const historyRouter = Router()

historyRouter.get('/', (req, res) => {
  const days = Math.min(Number(req.query.days) || 7, 90)
  const history = db.getHistory(days).map((h) => ({
    ...h,
    medications: db.getCompartmentMedications(h.compartmentId),
  }))
  res.json(history)
})

historyRouter.get('/adherence', (_req, res) => {
  const stats = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short' })
    const all = db.getHistory(1).filter((h: any) => h.date === dateStr)
    const taken = all.filter((h: any) => h.state === 'taken').length
    const missed = all.filter((h: any) => h.state === 'missed').length
    stats.push({ date: dateStr, day: dayLabel, taken, missed, total: all.length })
  }
  const allTaken = stats.reduce((s, d) => s + d.taken, 0)
  const allTotal = stats.reduce((s, d) => s + d.total, 0)
  const adherenceRate = allTotal > 0 ? Math.round((allTaken / allTotal) * 100) : 100
  res.json({ stats, adherenceRate })
})
