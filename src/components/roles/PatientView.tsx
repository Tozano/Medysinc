// ============================================================
// MédiSync — Patient View (Main Interaction Scenario)
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PillDispenserCanvas } from '../../scenes/PillDispenser3D'
import { Panel, StatCard, StatusBadge } from '../ui/Panel'
import { AlertPanel, Toast } from '../ui/AlertBanner'
import { Timeline, WeeklyAdherenceGrid } from '../ui/Timeline'
import { useAppStore, selectAlertsForRole } from '../../core/store/useAppStore'
import { usePillboxStore, selectTodayCompartments, selectAdherenceRate } from '../../core/store/usePillboxStore'
import { Compartment, CompartmentState, TimeSlot } from '../../core/types'
import { mockAdherenceData } from '../../core/mocks/data'

const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Matin',
  noon: 'Midi',
  evening: 'Soir',
  night: 'Nuit',
}

const SLOT_EMOJIS: Record<TimeSlot, string> = {
  morning: '🌅',
  noon: '☀️',
  evening: '🌆',
  night: '🌙',
}

// ── Compartment Interaction Card ─────────────────────────────
interface CompartmentCardProps {
  compartment: Compartment
  isActive: boolean
  onOpen: () => void
  onConfirmTake: () => void
  onCancel: () => void
}

function CompartmentCard({ compartment, isActive, onOpen, onConfirmTake, onCancel }: CompartmentCardProps) {
  const stateConfig = {
    [CompartmentState.LOCKED]: {
      border: 'border-white/5',
      bg: 'bg-navy-800/60',
      badge: '🔒',
      action: null,
    },
    [CompartmentState.READY]: {
      border: 'border-medical-blue/50 animate-glow',
      bg: 'bg-medical-blue/10',
      badge: '💡',
      action: 'open',
    },
    [CompartmentState.OPEN]: {
      border: 'border-medical-teal/50',
      bg: 'bg-medical-teal/10',
      badge: '📂',
      action: 'confirm',
    },
    [CompartmentState.TAKEN]: {
      border: 'border-status-taken/30',
      bg: 'bg-status-taken/8',
      badge: '✅',
      action: null,
    },
    [CompartmentState.MISSED]: {
      border: 'border-status-missed/50',
      bg: 'bg-status-missed/10',
      badge: '⚠️',
      action: null,
    },
  }

  const cfg = stateConfig[compartment.state]

  return (
    <motion.div
      layout
      className={`rounded-2xl border p-5 transition-all duration-300 ${cfg.border} ${cfg.bg} ${isActive ? 'ring-2 ring-medical-blue/40' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">{SLOT_EMOJIS[compartment.slot]}</span>
          <div>
            <p className="text-sm font-semibold text-white">{SLOT_LABELS[compartment.slot]}</p>
            <p className="text-xs text-slate-400">{compartment.scheduledTime}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg">{cfg.badge}</span>
          <StatusBadge state={compartment.state} />
        </div>
      </div>

      {/* Medications */}
      <div className="space-y-2 mb-4">
        {compartment.medications.map((med) => (
          <div
            key={med.id}
            className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl bg-navy-900/40"
          >
            <span
              className="w-3 h-3 rounded-full flex-shrink-0 border border-white/20"
              style={{ backgroundColor: med.color }}
            />
            <span className="text-sm text-slate-200 flex-1">{med.name}</span>
            <span className="text-xs text-slate-500 font-mono">{med.dosage}</span>
          </div>
        ))}
      </div>

      {/* Stock warning */}
      {compartment.stock <= compartment.lowStockThreshold && (
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-status-missed/15 border border-status-missed/30">
          <span className="text-xs">⚠️</span>
          <span className="text-xs text-status-missed font-medium">
            Stock faible : {compartment.stock} comprimés restants
          </span>
        </div>
      )}

      {/* Taken time */}
      {compartment.takenAt && compartment.state === CompartmentState.TAKEN && (
        <p className="text-xs text-status-taken mb-3">
          ✓ Pris à{' '}
          {new Date(compartment.takenAt).toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}

      {/* Actions */}
      <AnimatePresence mode="wait">
        {compartment.state === CompartmentState.READY && (
          <motion.button
            key="open"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpen}
            className="w-full py-3 rounded-xl bg-medical-blue hover:bg-medical-teal transition-colors text-sm font-bold text-white shadow-lg shadow-medical-blue/20"
          >
            Ouvrir le compartiment →
          </motion.button>
        )}
        {compartment.state === CompartmentState.OPEN && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-2"
          >
            <p className="text-xs text-center text-medical-teal mb-3 font-medium">
              Compartiment ouvert. Prenez vos médicaments et confirmez.
            </p>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirmTake}
              className="w-full py-3.5 rounded-xl bg-status-taken hover:bg-emerald-400 transition-colors text-sm font-bold text-white shadow-lg shadow-status-taken/20"
            >
              ✓ Confirmer la prise
            </motion.button>
            <button
              onClick={onCancel}
              className="w-full py-2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Annuler
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Active Dose Spotlight ─────────────────────────────────────
function NextDoseCard() {
  const compartments = usePillboxStore(selectTodayCompartments)
  const nextDose = compartments.find(
    (c) => c.state === CompartmentState.READY || c.state === CompartmentState.OPEN
  )

  if (!nextDose) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-r from-medical-blue/20 to-medical-teal/10 border border-medical-blue/40 p-5 mb-6"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-medical-blue animate-ping" />
        <span className="text-xs font-semibold uppercase tracking-wide text-medical-blue">
          Action requise
        </span>
      </div>
      <p className="text-white font-semibold">
        Traitement du {SLOT_LABELS[nextDose.slot].toLowerCase()} disponible
      </p>
      <p className="text-sm text-slate-300 mt-1">
        {nextDose.medications.length} médicament{nextDose.medications.length > 1 ? 's' : ''} à prendre à {nextDose.scheduledTime}
      </p>
    </motion.div>
  )
}

// ── Main Patient View ─────────────────────────────────────────
export function PatientView() {
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'settings'>('today')
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null)

  const { openCompartment, confirmTake, setActiveCompartment, activeCompartmentId } = usePillboxStore()
  const compartments = usePillboxStore(selectTodayCompartments)
  const adherenceRate = usePillboxStore(selectAdherenceRate)
  const history = usePillboxStore((s) => s.history)
  const patient = usePillboxStore((s) => s.patient)
  const device = usePillboxStore((s) => s.device)
  const alerts = useAppStore(selectAlertsForRole('patient'))

  if (!patient || !device) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <p className="text-slate-500">Chargement des données...</p>
    </div>
  )

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const handleOpen = (c: Compartment) => {
    openCompartment(c.id)
    setActiveCompartment(c.id)
  }

  const handleConfirm = (c: Compartment) => {
    confirmTake(c.id)
    showToast(`Prise du ${SLOT_LABELS[c.slot].toLowerCase()} confirmée ✓`, 'success')
  }

  const handleCancel = () => {
    setActiveCompartment(null)
  }

  const takenToday = compartments.filter((c) => c.state === CompartmentState.TAKEN).length
  const totalToday = compartments.length
  const missedToday = compartments.filter((c) => c.state === CompartmentState.MISSED).length

  return (
    <div className="min-h-screen bg-navy-900 pt-20">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Patient Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <div className="w-14 h-14 rounded-2xl bg-medical-blue/20 border border-medical-blue/30 flex items-center justify-center text-2xl">
            👤
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Bonjour, {patient.firstName} {patient.lastName}
            </h2>
            <p className="text-sm text-slate-400">
              {patient.age} ans · {patient.conditions[0]}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-800/80 border border-white/5">
            <span className="w-2 h-2 rounded-full bg-status-taken animate-pulse" />
            <span className="text-xs text-slate-300">Pilulier connecté</span>
            <span className="text-xs text-slate-500">• {device.batteryLevel}%</span>
          </div>
        </motion.div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Prises aujourd'hui"
            value={`${takenToday}/${totalToday}`}
            icon={<span>💊</span>}
            color={takenToday === totalToday ? 'text-status-taken' : 'text-medical-blue'}
          />
          <StatCard
            label="Observance 7j"
            value={adherenceRate}
            unit="%"
            icon={<span>📈</span>}
            color={adherenceRate >= 80 ? 'text-status-taken' : adherenceRate >= 60 ? 'text-status-upcoming' : 'text-status-missed'}
            trend={adherenceRate >= 80 ? 'up' : 'down'}
            trendLabel={adherenceRate >= 80 ? 'Bonne observance' : 'À améliorer'}
          />
          <StatCard
            label="Oublis aujourd'hui"
            value={missedToday}
            icon={<span>⚠️</span>}
            color={missedToday === 0 ? 'text-status-taken' : 'text-status-missed'}
          />
        </div>

        {/* Next dose spotlight */}
        <NextDoseCard />

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-navy-800/60 rounded-xl border border-white/5 mb-6 w-fit">
          {(['today', 'history', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-medical-blue text-white shadow-lg shadow-medical-blue/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'today' ? "Aujourd'hui" : tab === 'history' ? 'Historique' : 'Paramètres'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* TODAY TAB */}
          {activeTab === 'today' && (
            <motion.div
              key="today"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* 3D Pillbox */}
              <div className="lg:col-span-2 space-y-4">
                <Panel title="Pilulier connecté" subtitle="Cliquez sur un compartiment pour interagir" variant="elevated">
                  <PillDispenserCanvas
                    onCompartmentClick={(c) => {
                      if (c.state === CompartmentState.READY) handleOpen(c)
                    }}
                    height="280px"
                  />
                </Panel>

                {/* Alerts */}
                {alerts.filter((a) => !a.read).length > 0 && (
                  <Panel title="Alertes actives" icon={<span>🔔</span>} variant="alert">
                    <AlertPanel alerts={alerts.filter((a) => !a.read)} maxVisible={3} />
                  </Panel>
                )}
              </div>

              {/* Compartment Cards */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                  Compartiments du jour
                </p>
                {compartments.map((c) => (
                  <CompartmentCard
                    key={c.id}
                    compartment={c}
                    isActive={activeCompartmentId === c.id}
                    onOpen={() => handleOpen(c)}
                    onConfirmTake={() => handleConfirm(c)}
                    onCancel={handleCancel}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-2">
                <Panel title="Historique des prises" subtitle="7 derniers jours" variant="elevated">
                  <Timeline entries={history} maxDays={7} />
                </Panel>
              </div>
              <div className="space-y-4">
                <Panel title="Observance hebdomadaire" variant="elevated">
                  <WeeklyAdherenceGrid adherenceData={mockAdherenceData} />
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-sm text-slate-400">Taux global</span>
                    <span className={`text-lg font-bold ${adherenceRate >= 80 ? 'text-status-taken' : 'text-status-upcoming'}`}>
                      {adherenceRate}%
                    </span>
                  </div>
                </Panel>
                <Panel title="Traitements en cours" variant="default">
                  {usePillboxStore.getState().prescriptions.map((rx) => (
                    <div key={rx.id} className="flex items-start gap-3 py-3 border-b border-white/5 last:border-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: rx.medication.color }}
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{rx.medication.name} {rx.medication.dosage}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Expire dans{' '}
                          <span className={rx.daysUntilExpiry <= 7 ? 'text-status-missed font-semibold' : 'text-slate-300'}>
                            {rx.daysUntilExpiry} jours
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </Panel>
              </div>
            </motion.div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <Panel title="Configuration du pilulier" icon={<span>⚙️</span>} variant="elevated">
                <SettingsPanel />
              </Panel>
              <Panel title="Mon profil patient" icon={<span>👤</span>} variant="elevated">
                <PatientProfile />
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Settings Panel ────────────────────────────────────────────
function SettingsPanel() {
  const { device, updateAlertVolume, toggleAlertLight } = usePillboxStore()

  return (
    <div className="space-y-6">
      {/* Volume */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-300">Volume des alertes sonores</label>
          <span className="text-sm font-mono text-medical-blue">{device.alertVolume}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={device.alertVolume}
          onChange={(e) => updateAlertVolume(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none bg-navy-700 accent-medical-blue cursor-pointer"
        />
        <div className="flex justify-between text-xs text-slate-600 mt-1">
          <span>🔇</span>
          <span>🔊</span>
        </div>
      </div>

      {/* Light alert toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-navy-700/50 border border-white/5">
        <div>
          <p className="text-sm font-medium text-white">Alertes lumineuses LED</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Clignotement coloré selon l'urgence
          </p>
        </div>
        <button
          onClick={toggleAlertLight}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            device.alertLightEnabled ? 'bg-medical-blue' : 'bg-slate-600'
          }`}
        >
          <span
            className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              device.alertLightEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Scheduled times */}
      <div>
        <p className="text-sm font-medium text-slate-300 mb-3">Horaires programmées</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { slot: 'Matin', time: '08:00', icon: '🌅' },
            { slot: 'Midi', time: '12:00', icon: '☀️' },
            { slot: 'Soir', time: '18:00', icon: '🌆' },
            { slot: 'Nuit', time: '21:00', icon: '🌙' },
          ].map((s) => (
            <div key={s.slot} className="flex items-center gap-2 p-3 rounded-xl bg-navy-700/50 border border-white/5">
              <span className="text-sm">{s.icon}</span>
              <div>
                <p className="text-xs text-slate-400">{s.slot}</p>
                <p className="text-sm font-mono font-semibold text-white">{s.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Patient Profile ───────────────────────────────────────────
function PatientProfile() {
  const patient = usePillboxStore((s) => s.patient)
  const doctor = usePillboxStore((s) => s.doctor)
  const pharmacist = usePillboxStore((s) => s.pharmacist)

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-navy-700/40 border border-white/5">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">Informations patient</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-slate-400">Prénom</p>
            <p className="text-white font-medium">{patient.firstName}</p>
          </div>
          <div>
            <p className="text-slate-400">Nom</p>
            <p className="text-white font-medium">{patient.lastName}</p>
          </div>
          <div>
            <p className="text-slate-400">Âge</p>
            <p className="text-white font-medium">{patient.age} ans</p>
          </div>
          <div>
            <p className="text-slate-400">Date de naissance</p>
            <p className="text-white font-medium">{patient.dateOfBirth}</p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-navy-700/40 border border-white/5">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Pathologies</p>
        <div className="flex flex-wrap gap-2">
          {patient.conditions.map((c) => (
            <span key={c} className="px-2.5 py-1 rounded-full bg-medical-blue/15 border border-medical-blue/25 text-xs text-medical-blue">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-navy-700/40 border border-white/5">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Équipe soignante</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-base">🩺</span>
            <div>
              <p className="text-white font-medium">Dr. {doctor.firstName} {doctor.lastName}</p>
              <p className="text-xs text-slate-400">{doctor.specialty}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">💊</span>
            <div>
              <p className="text-white font-medium">{pharmacist.pharmacyName}</p>
              <p className="text-xs text-slate-400">{pharmacist.firstName} {pharmacist.lastName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
