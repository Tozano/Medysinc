// ============================================================
// MédiSync — Doctor View
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { Panel, StatCard } from '../ui/Panel'
import { AlertPanel, Toast } from '../ui/AlertBanner'
import { useAppStore, selectAlertsForRole } from '../../core/store/useAppStore'
import { usePillboxStore, selectAdherenceRate } from '../../core/store/usePillboxStore'
import { CompartmentState } from '../../core/types'
import { mockAdherenceData } from '../../core/mocks/data'

// ── Custom Tooltip ────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-navy-700 border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <p className="font-semibold text-white mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value}/{p.payload.total}
        </p>
      ))}
    </div>
  )
}

// ── Adherence Bar Chart ───────────────────────────────────────
function AdherenceBarChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={mockAdherenceData} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 4]} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="taken" name="Prises" radius={[4, 4, 0, 0]}>
          {mockAdherenceData.map((entry, i) => (
            <Cell
              key={i}
              fill={
                entry.taken === entry.total
                  ? '#06d6a0'
                  : entry.taken >= entry.total / 2
                  ? '#ffd166'
                  : '#ef476f'
              }
            />
          ))}
        </Bar>
        <Bar dataKey="missed" name="Oubliées" fill="rgba(239,71,111,0.25)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Weekly Trend Line ─────────────────────────────────────────
const trendData = [
  { week: 'S-6', observance: 72 },
  { week: 'S-5', observance: 68 },
  { week: 'S-4', observance: 75 },
  { week: 'S-3', observance: 82 },
  { week: 'S-2', observance: 78 },
  { week: 'S-1', observance: 85 },
  { week: 'Auj', observance: 71 },
]

function ObservanceTrend() {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={trendData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="week" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis domain={[50, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
        <Tooltip
          contentStyle={{ background: '#0f1f3d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
          labelStyle={{ color: '#f1f5f9', fontSize: 12 }}
          itemStyle={{ color: '#00b4d8', fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="observance"
          stroke="#00b4d8"
          strokeWidth={2.5}
          dot={{ fill: '#00b4d8', r: 4 }}
          activeDot={{ r: 6, fill: '#48cae4' }}
        />
        {/* 80% threshold reference */}
        <Line
          type="monotone"
          dataKey={() => 80}
          stroke="rgba(255,209,102,0.4)"
          strokeWidth={1.5}
          strokeDasharray="5 5"
          dot={false}
          name="Seuil 80%"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Prescription Renewal Card ─────────────────────────────────
function PrescriptionRenewalCard() {
  const prescriptions = usePillboxStore((s) => s.prescriptions)
  const patient = usePillboxStore((s) => s.patient)
  const doctor = usePillboxStore((s) => s.doctor)
  const [renewed, setRenewed] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const handleRenew = (rxId: string, medName: string) => {
    setRenewed((prev) => [...prev, rxId])
    setToast(`Ordonnance renouvelée : ${medName}`)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <>
      <AnimatePresence>
        {toast && <Toast message={toast} type="success" onClose={() => setToast(null)} />}
      </AnimatePresence>
      <div className="space-y-3">
        {prescriptions.map((rx) => {
          const isUrgent = rx.daysUntilExpiry <= 7
          const isRenewed = renewed.includes(rx.id)

          return (
            <div
              key={rx.id}
              className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                isRenewed
                  ? 'bg-status-taken/8 border-status-taken/30'
                  : isUrgent
                  ? 'bg-status-missed/8 border-status-missed/30'
                  : 'bg-navy-700/40 border-white/5'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: rx.medication.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white">
                  {rx.medication.name} {rx.medication.dosage}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Expire : {new Date(rx.endDate).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`text-sm font-bold ${
                    isRenewed ? 'text-status-taken' : isUrgent ? 'text-status-missed' : 'text-slate-300'
                  }`}
                >
                  {isRenewed ? '✓ Renouvelée' : `${rx.daysUntilExpiry}j`}
                </span>
                {!isRenewed && isUrgent && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleRenew(rx.id, rx.medication.name)}
                    className="px-3 py-1.5 rounded-lg bg-medical-blue hover:bg-medical-teal text-xs font-semibold text-white transition-colors"
                  >
                    Renouveler
                  </motion.button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── Missed Dose Pattern ───────────────────────────────────────
function MissedDosePattern() {
  const history = usePillboxStore((s) => s.history)
  const bySlot = { morning: 0, noon: 0, evening: 0, night: 0 }
  const slotLabels = { morning: 'Matin', noon: 'Midi', evening: 'Soir', night: 'Nuit' }
  const slotIcons = { morning: '🌅', noon: '☀️', evening: '🌆', night: '🌙' }

  history.forEach((h) => {
    if (h.state === CompartmentState.MISSED) bySlot[h.slot]++
  })

  const total = Object.values(bySlot).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-3">
      {(Object.entries(bySlot) as [keyof typeof bySlot, number][]).map(([slot, count]) => {
        const pct = total > 0 ? (count / total) * 100 : 0
        return (
          <div key={slot}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-sm">{slotIcons[slot]}</span>
                <span className="text-xs font-medium text-slate-300">{slotLabels[slot]}</span>
              </div>
              <span className="text-xs font-mono text-slate-400">{count} oubli{count > 1 ? 's' : ''}</span>
            </div>
            <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full bg-status-missed/70 rounded-full"
              />
            </div>
          </div>
        )
      })}
      {total === 0 && <p className="text-xs text-center text-status-taken py-4">✓ Aucun oubli détecté</p>}
    </div>
  )
}

// ── Main Doctor View ─────────────────────────────────────────
export function DoctorView() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prescriptions' | 'alerts'>('dashboard')
  const adherenceRate = usePillboxStore(selectAdherenceRate)
  const patient = usePillboxStore((s) => s.patient)
  const doctor = usePillboxStore((s) => s.doctor)
  const prescriptions = usePillboxStore((s) => s.prescriptions)
  const alerts = useAppStore(selectAlertsForRole('doctor'))
  const expiringCount = prescriptions.filter((p) => p.daysUntilExpiry <= 7).length

  if (!patient || !doctor) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <p className="text-slate-500">Chargement des données...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-navy-900 pt-20">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-status-upcoming/20 border border-status-upcoming/30 flex items-center justify-center text-2xl">
            🩺
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Dr. {doctor.firstName} {doctor.lastName}</h2>
            <p className="text-sm text-slate-400">{doctor.specialty} · {doctor.licenseNumber}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-slate-500">Patient suivi</p>
            <p className="text-sm font-semibold text-white">
              {patient.firstName} {patient.lastName}, {patient.age} ans
            </p>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard label="Observance" value={adherenceRate} unit="%" icon={<span>📊</span>} color={adherenceRate >= 80 ? 'text-status-taken' : adherenceRate >= 60 ? 'text-status-upcoming' : 'text-status-missed'} trend={adherenceRate >= 80 ? 'up' : 'down'} trendLabel="vs semaine dernière" />
          <StatCard label="Rx à renouveler" value={expiringCount} icon={<span>📋</span>} color={expiringCount > 0 ? 'text-status-missed' : 'text-status-taken'} />
          <StatCard label="Oublis cette sem." value={mockAdherenceData.reduce((sum, d) => sum + d.missed, 0)} icon={<span>⚠️</span>} color="text-status-upcoming" />
          <StatCard label="Alertes actives" value={alerts.filter((a) => !a.read).length} icon={<span>🔔</span>} color={alerts.filter((a) => !a.read).length > 0 ? 'text-status-missed' : 'text-status-taken'} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-navy-800/60 rounded-xl border border-white/5 mb-6 w-fit">
          {(['dashboard', 'prescriptions', 'alerts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab ? 'bg-status-upcoming/70 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'dashboard' ? 'Observance' : tab === 'prescriptions' ? 'Ordonnances' : 'Alertes'}
              {tab === 'prescriptions' && expiringCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-status-missed text-white text-[10px] font-bold flex items-center justify-center">
                  {expiringCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Panel title="Prises par jour — 7 derniers jours" subtitle="Vert = 100%, Jaune = partiel, Rouge = oublis" variant="elevated">
                  <AdherenceBarChart />
                </Panel>
                <Panel title="Tendance d'observance — 6 semaines" subtitle="Ligne pointillée = seuil optimal (80%)" variant="elevated">
                  <ObservanceTrend />
                </Panel>
              </div>
              <div className="space-y-4">
                <Panel title="Répartition des oublis" subtitle="Par créneau horaire" variant="elevated">
                  <MissedDosePattern />
                </Panel>
                <Panel title="Conditions médicales" variant="elevated">
                  <div className="space-y-2">
                    {patient.conditions.map((c) => (
                      <div key={c} className="flex items-center gap-2 p-3 rounded-xl bg-navy-700/50 border border-white/5">
                        <span className="w-2 h-2 rounded-full bg-medical-blue flex-shrink-0" />
                        <span className="text-sm text-slate-300">{c}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </motion.div>
          )}

          {activeTab === 'prescriptions' && (
            <motion.div key="presc" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Panel title="Suivi des ordonnances" subtitle="Renouvellement rapide pour les urgences" variant="elevated">
                  <PrescriptionRenewalCard />
                </Panel>
                <Panel title="Alertes médecin" variant={alerts.length > 0 ? 'alert' : 'default'}>
                  <AlertPanel alerts={alerts} maxVisible={5} />
                </Panel>
              </div>
            </motion.div>
          )}

          {activeTab === 'alerts' && (
            <motion.div key="alerts" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <Panel title="Toutes les alertes" variant="elevated">
                <AlertPanel alerts={alerts} maxVisible={10} />
              </Panel>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
