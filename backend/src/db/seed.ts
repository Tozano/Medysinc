// ============================================================
// MédiSync — Database Seed
// ============================================================

import { db, saveDb } from './database.js'

export function seed() {
  const now = new Date()
  const s = db.store

  // ── Actors ────────────────────────────────────────────────
  s.doctors['doctor-1'] = {
    id: 'doctor-1', firstName: 'Marie', lastName: 'Leclerc',
    specialty: 'Médecine générale', licenseNumber: 'RPPS-10012345678',
  }
  s.pharmacists['pharmacy-1'] = {
    id: 'pharmacy-1', firstName: 'Thomas', lastName: 'Bernard',
    pharmacyName: 'Pharmacie Centrale', address: '12 Rue de la République, 69001 Lyon',
  }
  s.carers['carer-1'] = {
    id: 'carer-1', firstName: 'Marie', lastName: 'Dupont',
    relation: 'Fille', phone: '06 12 34 56 78',
  }
  s.patients['patient-1'] = {
    id: 'patient-1', firstName: 'Jean', lastName: 'Dupont',
    age: 72, dateOfBirth: '1952-03-15',
    conditions: ['Diabète de type 2', 'Hypertension artérielle', 'Hypercholestérolémie'],
    doctorId: 'doctor-1', pharmacyId: 'pharmacy-1', carerId: 'carer-1',
  }

  // ── Medications ──────────────────────────────────────────
  const meds = [
    { id: 'med-1', name: 'Metformine',    dosage: '500 mg',  form: 'comprimé', color: '#ffffff' },
    { id: 'med-2', name: 'Lisinopril',    dosage: '10 mg',   form: 'comprimé', color: '#ffd6a5' },
    { id: 'med-3', name: 'Atorvastatine', dosage: '20 mg',   form: 'comprimé', color: '#caffbf' },
    { id: 'med-4', name: 'Bisoprolol',    dosage: '5 mg',    form: 'comprimé', color: '#fdffb6' },
    { id: 'med-5', name: 'Vitamine D3',   dosage: '1000 UI', form: 'gélule',   color: '#ffadad' },
  ]
  meds.forEach((m) => { s.medications[m.id] = m })

  // ── Device ───────────────────────────────────────────────
  s.devices['device-001'] = {
    id: 'device-001', serialNumber: 'MS-2026-00142', patientId: 'patient-1',
    batteryLevel: 78, wifiConnected: true, lastSync: now.toISOString(),
    firmwareVersion: '2.4.1', alertVolume: 75, alertLightEnabled: true,
  }

  // ── Compartments ─────────────────────────────────────────
  const compartments = [
    { id: 'comp-morning', slot: 'morning', time: '08:00', stock: 14, threshold: 7 },
    { id: 'comp-noon',    slot: 'noon',    time: '12:00', stock: 3,  threshold: 7 },
    { id: 'comp-evening', slot: 'evening', time: '18:00', stock: 21, threshold: 7 },
    { id: 'comp-night',   slot: 'night',   time: '21:00', stock: 28, threshold: 7 },
  ]
  compartments.forEach((c) => {
    s.compartments[c.id] = {
      id: c.id, deviceId: 'device-001', slot: c.slot,
      scheduledTime: c.time, state: 'locked', takenAt: null,
      isLocked: true, stock: c.stock, lowStockThreshold: c.threshold,
    }
  })

  // Compartment <-> Medications
  s.compartmentMedications = [
    { compartmentId: 'comp-morning', medicationId: 'med-1', quantity: 1 },
    { compartmentId: 'comp-morning', medicationId: 'med-2', quantity: 1 },
    { compartmentId: 'comp-noon',    medicationId: 'med-1', quantity: 1 },
    { compartmentId: 'comp-evening', medicationId: 'med-2', quantity: 1 },
    { compartmentId: 'comp-evening', medicationId: 'med-3', quantity: 1 },
    { compartmentId: 'comp-evening', medicationId: 'med-4', quantity: 1 },
    { compartmentId: 'comp-night',   medicationId: 'med-5', quantity: 1 },
  ]

  // ── Prescriptions ─────────────────────────────────────────
  s.prescriptions['rx-1'] = {
    id: 'rx-1', patientId: 'patient-1', doctorId: 'doctor-1', medicationId: 'med-1',
    startDate: '2026-01-01', endDate: '2026-03-18',
    frequency: ['morning', 'noon'], renewalRequired: true,
  }
  s.prescriptions['rx-2'] = {
    id: 'rx-2', patientId: 'patient-1', doctorId: 'doctor-1', medicationId: 'med-2',
    startDate: '2026-01-01', endDate: '2026-06-01',
    frequency: ['morning', 'evening'], renewalRequired: false,
  }
  s.prescriptions['rx-3'] = {
    id: 'rx-3', patientId: 'patient-1', doctorId: 'doctor-1', medicationId: 'med-3',
    startDate: '2026-01-01', endDate: '2026-04-15',
    frequency: ['evening'], renewalRequired: false,
  }

  // ── History (last 7 days ~85% adherence) ──────────────────
  const slotNames = ['comp-morning', 'comp-noon', 'comp-evening', 'comp-night']
  const slotTimes: Record<string, string> = {
    'comp-morning': '08:00', 'comp-noon': '12:00',
    'comp-evening': '18:00', 'comp-night': '21:00',
  }
  const statePattern = ['taken','taken','taken','taken','taken','taken','missed']

  for (let day = 6; day >= 1; day--) {
    const date = new Date()
    date.setDate(date.getDate() - day)
    const dateStr = date.toISOString().split('T')[0]

    slotNames.forEach((compId, slotIdx) => {
      const state = statePattern[(day + slotIdx) % statePattern.length]
      const slot = compId.replace('comp-', '')
      let takenAt: string | null = null
      if (state === 'taken') {
        const td = new Date(date)
        const [h, m] = slotTimes[compId].split(':').map(Number)
        td.setHours(h, m + Math.floor(Math.random() * 20), 0, 0)
        takenAt = td.toISOString()
      }
      const id = `hist-${day}-${slot}`
      s.history[id] = {
        id, patientId: 'patient-1', compartmentId: compId, slot,
        date: dateStr, scheduledTime: slotTimes[compId], takenAt, state,
      }
    })
  }

  // ── Initial alerts ────────────────────────────────────────
  s.alerts['alert-stock-1'] = {
    id: 'alert-stock-1', type: 'low_stock', severity: 'critical',
    title: 'Stock critique — Metformine midi',
    message: 'Compartiment midi : 3 comprimés restants. Rechargement nécessaire sous 3 jours.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    forRoles: ['pharmacist', 'carer'],
    patientId: 'patient-1', compartmentId: 'comp-noon', read: false, actionLabel: 'Recharger le pilulier',
  }
  s.alerts['alert-rx-1'] = {
    id: 'alert-rx-1', type: 'prescription_expiry', severity: 'warning',
    title: "Ordonnance proche de l'expiration",
    message: 'Ordonnance Metformine 500mg expire dans 7 jours. Renouvellement requis.',
    timestamp: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    forRoles: ['doctor', 'patient'],
    patientId: 'patient-1', compartmentId: null, read: false, actionLabel: "Renouveler l'ordonnance",
  }

  saveDb()
  console.log('[Seed] ✓ Database seeded')
  console.log('[Seed]   Patient  : Jean Dupont (patient-1)')
  console.log('[Seed]   Device   : MS-2026-00142 (device-001)')
  console.log('[Seed]   Compartments: 4 | History: 7 days | Alerts: 2')
}
