// ============================================================
// MédiSync — Top Navigation Header
// ============================================================

import { motion } from 'framer-motion'
import { useAppStore, selectUnreadAlerts } from '../../core/store/useAppStore'
import { UserRole } from '../../core/types'

const ROLE_LABELS: Record<UserRole, string> = {
  patient: 'Patient',
  carer: 'Aidant',
  pharmacist: 'Pharmacien',
  doctor: 'Médecin',
}

const ROLE_ICONS: Record<UserRole, string> = {
  patient: '👤',
  carer: '👥',
  pharmacist: '💊',
  doctor: '🩺',
}

const ROLE_COLORS: Record<UserRole, string> = {
  patient: 'text-medical-blue bg-medical-blue/15 border-medical-blue/30',
  carer: 'text-purple-400 bg-purple-400/15 border-purple-400/30',
  pharmacist: 'text-status-taken bg-status-taken/15 border-status-taken/30',
  doctor: 'text-status-upcoming bg-status-upcoming/15 border-status-upcoming/30',
}

export function Header() {
  const { activeScene, activeRole, goToHub } = useAppStore()
  const unreadAlerts = useAppStore(selectUnreadAlerts)
  const isHub = activeScene === 'hub'

  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-navy-900/80 backdrop-blur-md">
      {/* Logo */}
      <button
        onClick={isHub ? undefined : goToHub}
        className="flex items-center gap-3 group"
      >
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-medical-blue flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <rect x="3" y="8" width="18" height="12" rx="2" />
              <rect x="7" y="4" width="10" height="6" rx="1.5" />
              <circle cx="12" cy="14" r="2" />
            </svg>
          </div>
          {/* Active dot */}
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-status-taken rounded-full border-2 border-navy-900" />
        </div>
        <span className="text-lg font-bold text-white tracking-tight">
          Médi<span className="text-medical-blue">Sync</span>
        </span>
      </button>

      {/* Center — breadcrumb */}
      {!isHub && activeRole && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <button
            onClick={goToHub}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Accueil
          </button>
          <span className="text-slate-600">/</span>
          <span
            className={`text-sm font-medium px-3 py-1 rounded-full border ${ROLE_COLORS[activeRole]}`}
          >
            {ROLE_ICONS[activeRole]} {ROLE_LABELS[activeRole]}
          </span>
        </motion.div>
      )}

      {/* Right — actions */}
      <div className="flex items-center gap-3">
        {/* Device status */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-status-taken/10 border border-status-taken/20">
          <span className="w-1.5 h-1.5 rounded-full bg-status-taken animate-pulse" />
          <span className="text-xs font-medium text-status-taken">En ligne</span>
        </div>

        {/* Alert bell */}
        <button className="relative w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center border border-white/5">
          <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unreadAlerts.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-status-missed text-white text-[10px] font-bold flex items-center justify-center px-1"
            >
              {unreadAlerts.length}
            </motion.span>
          )}
        </button>

        {/* Back to hub */}
        {!isHub && (
          <button
            onClick={goToHub}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-white/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Changer de rôle
          </button>
        )}
      </div>
    </header>
  )
}
