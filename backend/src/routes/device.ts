import { Router } from 'express'
import { db } from '../db/database.js'

export const deviceRouter = Router()

deviceRouter.get('/', (_req, res) => {
  const device = db.getDevice('device-001')
  if (!device) return res.status(404).json({ error: 'Device not found' })

  const compartments = db.getDeviceCompartments(device.id).map((comp) => ({
    id: comp.id,
    slot: comp.slot,
    scheduledTime: comp.scheduledTime,
    state: comp.state,
    takenAt: comp.takenAt,
    isLocked: comp.isLocked,
    stock: comp.stock,
    lowStockThreshold: comp.lowStockThreshold,
    medications: db.getCompartmentMedications(comp.id),
  }))

  res.json({ ...device, compartments })
})

deviceRouter.patch('/settings', (req, res) => {
  const { alertVolume, alertLightEnabled } = req.body as any
  const patch: any = {}
  if (alertVolume !== undefined) patch.alertVolume = alertVolume
  if (alertLightEnabled !== undefined) patch.alertLightEnabled = alertLightEnabled
  db.updateDevice('device-001', patch)
  res.json({ success: true })
})
