// ============================================================
// MédiSync — Pharmacist View
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Panel, StatCard } from '../ui/Panel'
import { AlertPanel, Toast } from '../ui/AlertBanner'
import { useAppStore, selectAlertsForRole } from '../../core/store/useAppStore'
import { usePillboxStore, selectLowStockCompartments } from '../../core/store/usePillboxStore'
import { Compartment, TimeSlot } from '../../core/types'
import { AlertType, AlertSeverity } from '../../core/types'

const SLOT_LABELS: Record<TimeSlot, string> = { morning: 'Matin', noon: 'Midi', evening: 'Soir', night: 'Nuit' }
const SLOT_ICONS: Record<TimeSlot, string> = { morning: '🌅', noon: '☀️', evening: '🌆', night: '🌙' }

// ── Stock Level Bar ───────────────────────────────────────────
function StockBar({ current, max, threshold }: { current: number; max: number; threshold: number }) {
  const pct = Math.round((current / max) * 100)
  const color =
    current <= threshold
      ? 'bg-status-missed'
      : current <= threshold * 1.5
      ? 'bg-status-upcoming'
      : 'bg-status-taken'

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{current} unités</span>
        <span>/{max} max</span>
      </div>
      <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
      {current <= threshold && (
        <p className="text-xs text-status-missed mt-1">⚠️ Stock critique — rechargement requis</p>
      )}
    </div>
  )
}

// ── Compartment Stock Card ────────────────────────────────────
interface StockCardProps {
  compartment: Compartment
  onRefill: (id: string, qty: number) => void
}

function StockCard({ compartment, onRefill }: StockCardProps) {
  const [refillQty, setRefillQty] = useState(28)
  const [isRefilling, setIsRefilling] = useState(false)
  const maxStock = 28 * compartment.medications.length
  const isLow = compartment.stock <= compartment.lowStockThreshold

  const handleRefill = () => {
    setIsRefilling(true)
    setTimeout(() => {
      onRefill(compartment.id, refillQty)
      setIsRefilling(false)
    }, 800)
  }

  return (
    <motion.div
      className={`rounded-2xl p-5 border transition-all ${
        isLow
          ? 'bg-status-missed/8 border-status-missed/30'
          : 'bg-navy-800/60 border-white/5'
      }`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">{SLOT_ICONS[compartment.slot]}</span>
          <div>
            <p className="text-sm font-semibold text-white">{SLOT_LABELS[compartment.slot]}</p>
            <p className="text-xs text-slate-400">{compartment.scheduledTime}</p>
          </div>
        </div>
        {isLow && (
          <span className="px-2.5 py-1 rounded-full bg-status-missed/20 border border-status-missed/30 text-xs text-status-missed font-medium animate-pulse">
            Critique
          </span>
        )}
      </div>

      {/* Medications */}
      <div className="space-y-1.5 mb-4">
        {compartment.medications.map((med) => (
          <div key={med.id} className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: med.color }} />
            <span>{med.name} {med.dosage}</span>
          </div>
        ))}
      </div>

      {/* Stock bar */}
      <StockBar
        current={compartment.stock}
        max={maxStock}
        threshold={compartment.lowStockThreshold}
      />

      {/* Refill controls */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 w-24">Quantité à ajouter</label>
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setRefillQty(Math.max(1, refillQty - 7))}
              className="w-7 h-7 rounded-lg bg-navy-700 text-white text-sm hover:bg-navy-600 transition-colors flex items-center justify-center"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-mono font-bold text-white">{refillQty}</span>
            <button
              onClick={() => setRefillQty(Math.min(56, refillQty + 7))}
              className="w-7 h-7 rounded-lg bg-navy-700 text-white text-sm hover:bg-navy-600 transition-colors flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleRefill}
          disabled={isRefilling}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all ${
            isRefilling
              ? 'bg-status-taken/30 text-status-taken cursor-wait'
              : isLow
              ? 'bg-status-taken hover:bg-emerald-400 text-white shadow-lg shadow-status-taken/20'
              : 'bg-navy-700/80 hover:bg-navy-600 text-slate-200 border border-white/10'
          }`}
        >
          {isRefilling ? '⟳ Rechargement...' : `💊 Recharger (+${refillQty})`}
        </motion.button>
      </div>
    </motion.div>
  )
}

// ── Prescription Renewals ─────────────────────────────────────
function PrescriptionPanel() {
  const prescriptions = usePillboxStore((s) => s.prescriptions)

  return (
    <div className="space-y-3">
      {prescriptions.map((rx) => (
        <div
          key={rx.id}
          className={`flex items-center gap-4 p-4 rounded-xl border ${
            rx.daysUntilExpiry <= 7
              ? 'bg-status-missed/8 border-status-missed/30'
              : rx.daysUntilExpiry <= 30
              ? 'bg-status-upcoming/8 border-status-upcoming/20'
              : 'bg-navy-700/40 border-white/5'
          }`}
        >
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: rx.medication.color }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">
              {rx.medication.name} {rx.medication.dosage}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Expire le {new Date(rx.endDate).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p
              className={`text-sm font-bold ${
                rx.daysUntilExpiry <= 7
                  ? 'text-status-missed'
                  : rx.daysUntilExpiry <= 30
                  ? 'text-status-upcoming'
                  : 'text-status-taken'
              }`}
            >
              {rx.daysUntilExpiry}j
            </p>
            <p className="text-xs text-slate-500">restants</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Main Pharmacist View ──────────────────────────────────────
export function PharmacistView() {
  const [activeTab, setActiveTab] = useState<'stock' | 'prescriptions' | 'history'>('stock')
  const [toast, setToast] = useState<{ msg: string } | null>(null)

  const { device, refillCompartment, refillLogs } = usePillboxStore()
  const patient = usePillboxStore((s) => s.patient)
  const pharmacist = usePillboxStore((s) => s.pharmacist)
  const lowStockComps = usePillboxStore(selectLowStockCompartments)
  const alerts = useAppStore(selectAlertsForRole('pharmacist'))
  const { addAlert } = useAppStore()

  if (!device || !patient || !pharmacist) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <p className="text-slate-500">Chargement des données...</p>
    </div>
  )

  const handleRefill = (compartmentId: string, qty: number) => {
    refillCompartment(compartmentId, qty)
    const comp = device.compartments.find((c) => c.id === compartmentId)
    const newAlert = {
      id: `alert-refill-${Date.now()}`,
      type: AlertType.REFILL_DONE,
      severity: AlertSeverity.INFO,
      title: 'Rechargement effectué',
      message: `Compartiment ${comp ? SLOT_LABELS[comp.slot] : ''} rechargé de ${qty} unités par ${pharmacist.firstName} ${pharmacist.lastName}.`,
      timestamp: new Date().toISOString(),
      forRoles: ['patient', 'carer'] as const,
      patientId: patient.id,
      compartmentId,
      read: false,
    }
    addAlert(newAlert as any)
    setToast({ msg: `Rechargement confirmé : +${qty} unités` })
    setTimeout(() => setToast(null), 3000)
  }

  const totalStock = device.compartments.reduce((sum, c) => sum + c.stock, 0)
  const criticalCount = lowStockComps.length

  return (
    <div className="min-h-screen bg-navy-900 pt-20">
      <AnimatePresence>
        {toast && (
          <Toast message={toast.msg} type="success" onClose={() => setToast(null)} />
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-status-taken/20 border border-status-taken/30 flex items-center justify-center text-2xl">
            💊
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{pharmacist.pharmacyName}</h2>
            <p className="text-sm text-slate-400">
              {pharmacist.firstName} {pharmacist.lastName} · {pharmacist.address}
            </p>
          </div>
          {criticalCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-status-missed/15 border border-status-missed/30"
            >
              <span className="w-2 h-2 rounded-full bg-status-missed animate-ping" />
              <span className="text-sm text-status-missed font-semibold">
                {criticalCount} stock{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Stock total"
            value={totalStock}
            unit="unités"
            icon={<span>📦</span>}
            color="text-medical-blue"
          />
          <StatCard
            label="Alertes stock"
            value={criticalCount}
            icon={<span>⚠️</span>}
            color={criticalCount > 0 ? 'text-status-missed' : 'text-status-taken'}
          />
          <StatCard
            label="Ordonnances"
            value={usePillboxStore.getState().prescriptions.filter((p) => p.daysUntilExpiry <= 7).length}
            unit="à renouveler"
            icon={<span>📋</span>}
            color="text-status-upcoming"
          />
        </div>

        {/* Patient info strip */}
        <div className="flex items-center gap-3 mb-6 p-4 rounded-2xl bg-navy-800/60 border border-white/5">
          <span className="text-lg">👤</span>
          <div>
            <p className="text-sm font-semibold text-white">
              Patient : {patient.firstName} {patient.lastName}, {patient.age} ans
            </p>
            <p className="text-xs text-slate-400">
              Pilulier n° {device.serialNumber} · Dernière sync il y a{' '}
              {Math.round((Date.now() - new Date(device.lastSync).getTime()) / 60000)} min
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-navy-800/60 rounded-xl border border-white/5 mb-6 w-fit">
          {(['stock', 'prescriptions', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab ? 'bg-status-taken/80 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'stock' ? 'Stocks' : tab === 'prescriptions' ? 'Ordonnances' : 'Historique'}
              {tab === 'stock' && criticalCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-status-missed text-white text-[10px] font-bold flex items-center justify-center">
                  {criticalCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'stock' && (
            <motion.div key="stock" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {device.compartments.map((c) => (
                  <StockCard key={c.id} compartment={c} onRefill={handleRefill} />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'prescriptions' && (
            <motion.div key="presc" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Panel title="Ordonnances actives" subtitle="Dates d'expiration" variant="elevated">
                  <PrescriptionPanel />
                </Panel>
                <Panel title="Alertes pharmacien" variant={alerts.length > 0 ? 'alert' : 'default'}>
                  <AlertPanel alerts={alerts} maxVisible={5} />
                </Panel>
              </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div key="hist" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <Panel title="Journal de rechargements" variant="elevated">
                {refillLogs.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">Aucun rechargement enregistré</p>
                ) : (
                  <div className="space-y-4">
                    {refillLogs.map((log) => (
                      <div key={log.id} className="p-4 rounded-xl bg-navy-700/40 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-white">
                            {new Date(log.date).toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </p>
                          <span className="text-xs text-status-taken bg-status-taken/15 px-2.5 py-0.5 rounded-full">
                            Complété
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{log.notes}</p>
                        <div className="flex flex-wrap gap-2">
                          {log.compartments.map((c) => {
                            const comp = device.compartments.find((d) => d.id === c.compartmentId)
                            return (
                              <span key={c.compartmentId} className="text-xs px-2 py-1 rounded-lg bg-navy-800 border border-white/5 text-slate-300">
                                {comp ? SLOT_LABELS[comp.slot] : c.compartmentId} +{c.quantity}
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
