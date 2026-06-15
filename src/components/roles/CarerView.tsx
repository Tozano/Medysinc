// ============================================================
// MédiSync — Carer View (Aidant)
// ============================================================

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Panel, StatCard } from '../ui/Panel'
import { AlertPanel } from '../ui/AlertBanner'
import { Timeline, WeeklyAdherenceGrid } from '../ui/Timeline'
import { useAppStore, selectAlertsForRole } from '../../core/store/useAppStore'
import { usePillboxStore, selectTodayCompartments, selectAdherenceRate } from '../../core/store/usePillboxStore'
import { CompartmentState, TimeSlot } from '../../core/types'
import { mockAdherenceData } from '../../core/mocks/data'

const SLOT_LABELS: Record<TimeSlot, string> = {
  morning: 'Matin',
  noon: 'Midi',
  evening: 'Soir',
  night: 'Nuit',
}

const SLOT_ICONS: Record<TimeSlot, string> = {
  morning: '🌅',
  noon: '☀️',
  evening: '🌆',
  night: '🌙',
}

// ── Real-time Pillbox Status Grid ─────────────────────────────
function PillboxStatusGrid() {
  const compartments = usePillboxStore(selectTodayCompartments)

  const stateStyles: Record<CompartmentState, { bg: string; border: string; text: string; icon: string }> = {
    [CompartmentState.TAKEN]: { bg: 'bg-status-taken/15', border: 'border-status-taken/40', text: 'text-status-taken', icon: '✓' },
    [CompartmentState.MISSED]: { bg: 'bg-status-missed/15', border: 'border-status-missed/40', text: 'text-status-missed', icon: '✕' },
    [CompartmentState.READY]: { bg: 'bg-medical-blue/15', border: 'border-medical-blue/40', text: 'text-medical-blue', icon: '◎' },
    [CompartmentState.LOCKED]: { bg: 'bg-white/5', border: 'border-white/10', text: 'text-slate-500', icon: '🔒' },
    [CompartmentState.OPEN]: { bg: 'bg-medical-teal/15', border: 'border-medical-teal/40', text: 'text-medical-teal', icon: '⬡' },
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {compartments.map((c) => {
        const s = stateStyles[c.state]
        return (
          <motion.div
            key={c.id}
            className={`rounded-2xl p-4 border ${s.bg} ${s.border} text-center`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={`text-2xl font-bold mb-1 ${s.text}`}>{s.icon}</div>
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-sm">{SLOT_ICONS[c.slot]}</span>
              <span className="text-sm font-semibold text-white">{SLOT_LABELS[c.slot]}</span>
            </div>
            <p className="text-xs text-slate-400">{c.scheduledTime}</p>
            {c.takenAt && (
              <p className={`text-xs ${s.text} mt-1`}>
                {new Date(c.takenAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
            {c.stock <= c.lowStockThreshold && (
              <p className="text-xs text-status-missed mt-1">⚠️ {c.stock} restants</p>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// ── Contact Patient Button ────────────────────────────────────
function ContactPatientCard() {
  const [contactSent, setContactSent] = useState(false)
  const patient = usePillboxStore((s) => s.patient)
  const carer = usePillboxStore((s) => s.carer)

  if (!patient || !carer) return null

  return (
    <div className="p-4 rounded-2xl bg-navy-700/40 border border-white/5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-xl">👤</div>
        <div>
          <p className="text-sm font-semibold text-white">{patient.firstName} {patient.lastName}</p>
          <p className="text-xs text-slate-400">Votre proche — {patient.age} ans</p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!contactSent ? (
          <motion.div key="btns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setContactSent(true); setTimeout(() => setContactSent(false), 3000) }}
              className="py-2.5 rounded-xl bg-purple-500/20 border border-purple-400/30 text-sm font-medium text-purple-300 hover:bg-purple-500/30 transition-colors"
            >
              📞 Appeler
            </button>
            <button
              onClick={() => { setContactSent(true); setTimeout(() => setContactSent(false), 3000) }}
              className="py-2.5 rounded-xl bg-medical-blue/20 border border-medical-blue/30 text-sm font-medium text-medical-blue hover:bg-medical-blue/30 transition-colors"
            >
              💬 Message
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="py-2.5 rounded-xl bg-status-taken/20 border border-status-taken/30 text-center"
          >
            <p className="text-sm text-status-taken font-medium">✓ Contact envoyé à {patient.firstName}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Carer View ────────────────────────────────────────────
export function CarerView() {
  const [activeTab, setActiveTab] = useState<'overview' | 'journal' | 'alerts'>('overview')
  const alerts = useAppStore(selectAlertsForRole('carer'))
  const unreadAlerts = alerts.filter((a) => !a.read)
  const adherenceRate = usePillboxStore(selectAdherenceRate)
  const history = usePillboxStore((s) => s.history)
  const patient = usePillboxStore((s) => s.patient)
  const carer = usePillboxStore((s) => s.carer)
  const compartments = usePillboxStore(selectTodayCompartments)

  const takenToday = compartments.filter((c) => c.state === CompartmentState.TAKEN).length
  const missedToday = compartments.filter((c) => c.state === CompartmentState.MISSED).length

  if (!patient || !carer) return (
    <div className="min-h-screen bg-navy-900 flex items-center justify-center">
      <p className="text-slate-500">Chargement des données...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-navy-900 pt-20">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-2xl">
            👥
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Tableau de bord Aidant</h2>
            <p className="text-sm text-slate-400">
              {carer.firstName} {carer.lastName} · {carer.relation} de {patient.firstName} {patient.lastName}
            </p>
          </div>
          {unreadAlerts.length > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-status-missed/15 border border-status-missed/30"
            >
              <span className="w-2 h-2 rounded-full bg-status-missed animate-ping" />
              <span className="text-sm text-status-missed font-semibold">
                {unreadAlerts.length} alerte{unreadAlerts.length > 1 ? 's' : ''}
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard
            label="Prises aujourd'hui"
            value={`${takenToday}/${compartments.length}`}
            icon={<span>✅</span>}
            color={takenToday === compartments.length ? 'text-status-taken' : 'text-medical-blue'}
          />
          <StatCard
            label="Oublis aujourd'hui"
            value={missedToday}
            icon={<span>⚠️</span>}
            color={missedToday === 0 ? 'text-status-taken' : 'text-status-missed'}
          />
          <StatCard
            label="Observance 7j"
            value={adherenceRate}
            unit="%"
            icon={<span>📊</span>}
            color={adherenceRate >= 80 ? 'text-status-taken' : 'text-status-upcoming'}
            trend={adherenceRate >= 80 ? 'up' : 'down'}
            trendLabel={adherenceRate >= 80 ? 'Bonne tendance' : 'Attention requise'}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-navy-800/60 rounded-xl border border-white/5 mb-6 w-fit">
          {(['overview', 'journal', 'alerts'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab ? 'bg-purple-500/80 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab === 'overview' ? 'Vue d\'ensemble' : tab === 'journal' ? 'Journal' : 'Alertes'}
              {tab === 'alerts' && unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-status-missed text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadAlerts.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Panel title={`Pilulier de ${patient.firstName} — Aujourd'hui`} subtitle="Statut en temps réel" variant="elevated">
                  <PillboxStatusGrid />
                </Panel>
                <Panel title="Observance hebdomadaire" variant="elevated">
                  <WeeklyAdherenceGrid adherenceData={mockAdherenceData} />
                </Panel>
              </div>
              <div className="space-y-4">
                <Panel title="Contact" variant="elevated">
                  <ContactPatientCard />
                </Panel>
                <Panel title="Alertes récentes" variant={unreadAlerts.length > 0 ? 'alert' : 'default'}>
                  <AlertPanel alerts={alerts.slice(0, 3)} maxVisible={3} />
                </Panel>
              </div>
            </motion.div>
          )}

          {activeTab === 'journal' && (
            <motion.div key="journal" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <Panel title={`Journal des prises — ${patient.firstName} ${patient.lastName}`} subtitle="Historique complet des 7 derniers jours" variant="elevated">
                <Timeline entries={history} maxDays={7} />
              </Panel>
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
