import { Router } from 'express'
import { db } from '../db/database.js'

export const patientsRouter = Router()

patientsRouter.get('/:id', (req, res) => {
  const patient = db.getPatient(req.params.id)
  if (!patient) return res.status(404).json({ error: 'Patient not found' })

  const doctor = db.getDoctor(patient.doctorId)
  const pharmacist = db.getPharmacist(patient.pharmacyId)
  const carer = patient.carerId ? db.getCarer(patient.carerId) : null

  const prescriptions = db.getPatientPrescriptions(patient.id).map((rx: any) => {
    const med = db.store.medications[rx.medicationId]
    const daysUntilExpiry = Math.max(0, Math.round(
      (new Date(rx.endDate).getTime() - Date.now()) / 86_400_000
    ))
    return { ...rx, medication: med, daysUntilExpiry }
  })

  res.json({ ...patient, doctor, pharmacist, carer, prescriptions })
})

patientsRouter.patch('/:id/prescriptions/:rxId/renew', (req, res) => {
  const newEnd = new Date()
  newEnd.setMonth(newEnd.getMonth() + 3)
  const newEndDate = newEnd.toISOString().split('T')[0]
  db.updatePrescription(req.params.rxId, { endDate: newEndDate, renewalRequired: false })
  res.json({ success: true, newEndDate })
})
