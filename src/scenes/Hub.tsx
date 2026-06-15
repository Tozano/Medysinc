// ============================================================
// MédiSync — Hub Scene (Role Selector + Overview)
// ============================================================

import { motion } from 'framer-motion'
import { useAppStore } from '../core/store/useAppStore'
import { UserRole } from '../core/types'
import { usePillboxStore, selectTodayCompartments } from '../core/store/usePillboxStore'

// ── Role Cards Data ───────────────────────────────────────────
interface RoleCardData {
  role: UserRole
  label: string
  icon: string
  description: string
  scenarios: string[]
  color: string
  gradient: string
  borderColor: string
}

const ROLE_CARDS: RoleCardData[] = [
  {
    role: 'patient',
    label: 'Patient',
    icon: '👤',
    description: 'Gérez vos prises de médicaments au quotidien',
    scenarios: ['Alerte de prise', 'Confirmer une prise', 'Historique personnel'],
    color: 'text-medical-blue',
    gradient: 'from-medical-blue/20 to-transparent',
    borderColor: 'border-medical-blue/30 hover:border-medical-blue/60',
  },
  {
    role: 'carer',
    label: 'Aidant',
    icon: '👥',
    description: 'Suivez et accompagnez votre proche',
    scenarios: ['Journal des prises', 'Alertes d\'oubli', 'Contact patient'],
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-transparent',
    borderColor: 'border-purple-400/30 hover:border-purple-400/60',
  },
  {
    role: 'pharmacist',
    label: 'Pharmacien',
    icon: '💊',
    description: 'Gérez les stocks et rechargez le pilulier',
    scenarios: ['Niveaux de stock', 'Rechargement virtuel', 'Prescriptions actives'],
    color: 'text-status-taken',
    gradient: 'from-status-taken/20 to-transparent',
    borderColor: 'border-status-taken/30 hover:border-status-taken/60',
  },
  {
    role: 'doctor',
    label: 'Médecin',
    icon: '🩺',
    description: 'Supervisez l\'observance et les prescriptions',
    scenarios: ['Tableau d\'observance', 'Alertes ordonnances', 'Renouvellement Rx'],
    color: 'text-status-upcoming',
    gradient: 'from-status-upcoming/20 to-transparent',
    borderColor: 'border-status-upcoming/30 hover:border-status-upcoming/60',
  },
]

// ── Animated Background Particles ────────────────────────────
function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full blur-3xl opacity-10"
          style={{
            width: `${200 + i * 80}px`,
            height: `${200 + i * 80}px`,
            background: i % 2 === 0 ? '#00b4d8' : '#48cae4',
            left: `${[10, 60, 30, 80, 5, 70][i]}%`,
            top: `${[20, 60, 80, 10, 50, 30][i]}%`,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -20, 30, 0],
            scale: [1, 1.1, 0.9, 1],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 1.5,
          }}
        />
      ))}
    </div>
  )
}

// ── Role Card Component ───────────────────────────────────────
interface RoleCardProps {
  data: RoleCardData
  index: number
  onSelect: (role: UserRole) => void
}

function RoleCard({ data, index, onSelect }: RoleCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.08, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(data.role)}
      className={`
        relative w-full text-left rounded-2xl p-6
        bg-navy-800/80 backdrop-blur-sm
        border ${data.borderColor}
        transition-all duration-200 group
        overflow-hidden
      `}
    >
      {/* Gradient overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${data.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
      />

      <div className="relative z-10">
        {/* Icon + Label */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl
              bg-gradient-to-br ${data.gradient} border border-white/10`}
          >
            {data.icon}
          </div>
          <div>
            <h3 className={`text-lg font-bold ${data.color}`}>{data.label}</h3>
            <p className="text-xs text-slate-400">Mode démo</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-300 mb-4 leading-relaxed">
          {data.description}
        </p>

        {/* Scenarios */}
        <ul className="space-y-1.5">
          {data.scenarios.map((s) => (
            <li key={s} className="flex items-center gap-2 text-xs text-slate-400">
              <span className={`w-1 h-1 rounded-full ${data.color} bg-current flex-shrink-0`} />
              {s}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div
          className={`mt-5 flex items-center gap-2 text-sm font-semibold ${data.color} group-hover:gap-3 transition-all`}
        >
          <span>Entrer dans ce rôle</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>
    </motion.button>
  )
}

// ── 2D Pillbox Preview ───────────────────────────────────────
const STATE_COLORS: Record<string, { bg: string; border: string; glow: string; icon: string; label: string }> = {
  locked:  { bg: 'bg-navy-700/60',       border: 'border-white/10',          glow: '',                              icon: '🔒', label: 'Verrouillé' },
  ready:   { bg: 'bg-medical-blue/20',   border: 'border-medical-blue/60',   glow: 'shadow-medical-blue/30',        icon: '💡', label: 'À prendre' },
  open:    { bg: 'bg-medical-teal/20',   border: 'border-medical-teal/60',   glow: 'shadow-medical-teal/30',        icon: '📂', label: 'Ouvert' },
  taken:   { bg: 'bg-status-taken/20',   border: 'border-status-taken/50',   glow: 'shadow-status-taken/20',        icon: '✓',  label: 'Pris' },
  missed:  { bg: 'bg-status-missed/20',  border: 'border-status-missed/50',  glow: 'shadow-status-missed/20',       icon: '✕',  label: 'Oublié' },
}
const SLOT_LABELS: Record<string, string> = { morning: 'Matin', noon: 'Midi', evening: 'Soir', night: 'Nuit' }
const SLOT_ICONS: Record<string, string>  = { morning: '🌅',    noon: '☀️',   evening: '🌆',   night: '🌙' }

function PillboxPreview2D() {
  const compartments = usePillboxStore(selectTodayCompartments)

  return (
    <div className="rounded-2xl border border-white/5 bg-navy-800/30 backdrop-blur-sm p-6">
      {/* Device silhouette */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="flex-1 h-px bg-white/5" />
        <span className="text-xs text-slate-500 font-mono">MS-2026-00142</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      <div className="grid grid-cols-4 gap-4">
        {compartments.map((c: any, i: number) => {
          const cfg = STATE_COLORS[c.state] ?? STATE_COLORS.locked
          const isReady = c.state === 'ready'
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className={`relative rounded-2xl p-4 border ${cfg.bg} ${cfg.border} ${cfg.glow ? `shadow-lg ${cfg.glow}` : ''} ${isReady ? 'animate-pulse' : ''}`}
            >
              {/* Slot icon + time */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg">{SLOT_ICONS[c.slot]}</span>
                <span className="text-[10px] font-mono text-slate-500">{c.scheduledTime}</span>
              </div>

              {/* Slot label */}
              <p className="text-xs font-semibold text-slate-300 mb-1">{SLOT_LABELS[c.slot]}</p>

              {/* State badge */}
              <div className="flex items-center gap-1.5 mb-3">
                <span className="text-sm">{cfg.icon}</span>
                <span className="text-[10px] text-slate-400">{cfg.label}</span>
              </div>

              {/* Stock bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Stock</span>
                  <span className={c.stock <= c.lowStockThreshold ? 'text-status-missed font-bold' : 'text-slate-400'}>
                    {c.stock}
                  </span>
                </div>
                <div className="h-1 bg-navy-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${c.stock <= c.lowStockThreshold ? 'bg-status-missed' : 'bg-status-taken'}`}
                    style={{ width: `${Math.min(100, Math.round((c.stock / 28) * 100))}%` }}
                  />
                </div>
              </div>

              {/* Medications */}
              <div className="mt-2 flex flex-wrap gap-1">
                {c.medications.slice(0, 2).map((m: any) => (
                  <span
                    key={m.id}
                    className="inline-block w-3 h-3 rounded-full border border-white/20"
                    style={{ background: m.color }}
                    title={m.name}
                  />
                ))}
                {c.medications.length > 2 && (
                  <span className="text-[9px] text-slate-500">+{c.medications.length - 2}</span>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-5">
        {Object.entries(STATE_COLORS).filter(([k]) => ['taken','ready','missed','locked'].includes(k)).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-sm border ${cfg.bg} ${cfg.border}`} />
            <span className="text-[11px] text-slate-500">{cfg.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Device Status Strip ───────────────────────────────────────
function DeviceStatusStrip() {
  const { device, isLoading } = usePillboxStore()

  if (isLoading || !device) {
    return (
      <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-navy-800/60 border border-white/5 backdrop-blur-sm text-xs text-slate-500 animate-pulse">
        <span className="w-2 h-2 rounded-full bg-slate-600" />
        Connexion au pilulier...
      </div>
    )
  }

  const lastSyncMins = Math.round((Date.now() - new Date(device.lastSync).getTime()) / 60000)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="flex items-center gap-6 px-6 py-3 rounded-2xl bg-navy-800/60 border border-white/5 backdrop-blur-sm text-xs"
    >
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-status-taken animate-pulse" />
        <span className="text-slate-400">Appareil</span>
        <span className="text-status-taken font-semibold">Connecté</span>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2">
        <span className="text-slate-400">Batterie</span>
        <span className="text-white font-semibold">{device.batteryLevel}%</span>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2">
        <span className="text-slate-400">Sync</span>
        <span className="text-slate-300">il y a {lastSyncMins}min</span>
      </div>
      <div className="w-px h-4 bg-white/10" />
      <div className="flex items-center gap-2">
        <span className="text-slate-400">N° série</span>
        <span className="text-slate-300 font-mono">{device.serialNumber}</span>
      </div>
    </motion.div>
  )
}

// ── Main Hub Scene ────────────────────────────────────────────
export function Hub() {
  const { navigateTo } = useAppStore()

  const handleRoleSelect = (role: UserRole) => {
    navigateTo(role, role)
  }

  return (
    <div className="relative min-h-screen bg-navy-900 overflow-hidden">
      <BackgroundOrbs />

      <div className="relative z-10 container mx-auto px-4 pt-24 pb-16 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-medical-blue/10 border border-medical-blue/20 text-medical-blue text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-medical-blue animate-pulse" />
            POC Interactif — Simulation en temps réel
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight"
          >
            Le pilulier intelligent
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-medical-blue to-medical-teal">
              qui prend soin de vous
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-lg text-slate-400 max-w-2xl mx-auto mb-8"
          >
            MédiSync connecte le patient, l'aidant, le pharmacien et le médecin
            autour d'un pilulier intelligent. Choisissez un rôle pour simuler l'expérience.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <DeviceStatusStrip />
          </motion.div>
        </div>

        {/* Pillbox Preview (2D lightweight) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="mb-12"
        >
          <PillboxPreview2D />

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
            {[
              { color: 'bg-status-taken', label: 'Prise confirmée' },
              { color: 'bg-medical-blue animate-pulse', label: 'À prendre maintenant' },
              { color: 'bg-status-missed', label: 'Oubliée' },
              { color: 'bg-status-locked', label: 'Verrouillé' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-sm ${item.color}`} />
                <span className="text-xs text-slate-400">{item.label}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Role Cards Grid */}
        <div className="mb-8">
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-center text-sm font-semibold uppercase tracking-widest text-slate-500 mb-6"
          >
            Choisissez votre rôle pour démarrer la simulation
          </motion.h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ROLE_CARDS.map((card, i) => (
              <RoleCard
                key={card.role}
                data={card}
                index={i}
                onSelect={handleRoleSelect}
              />
            ))}
          </div>
        </div>

        {/* Footer info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-xs text-slate-600">
            POC MédiSync v1.0 — Données simulées à des fins de démonstration uniquement
          </p>
        </motion.div>
      </div>
    </div>
  )
}
