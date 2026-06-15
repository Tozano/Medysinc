// ============================================================
// MédiSync — Alert / Notification Component
// ============================================================

import { motion, AnimatePresence } from 'framer-motion'
import { Alert, AlertSeverity, AlertType } from '../../core/types'
import { useAppStore } from '../../core/store/useAppStore'

const severityConfig: Record<AlertSeverity, { border: string; bg: string; icon: string; dot: string }> = {
  [AlertSeverity.INFO]: {
    border: 'border-medical-blue/40',
    bg: 'bg-medical-blue/10',
    icon: 'ℹ️',
    dot: 'bg-medical-blue',
  },
  [AlertSeverity.WARNING]: {
    border: 'border-status-upcoming/40',
    bg: 'bg-status-upcoming/10',
    icon: '⚠️',
    dot: 'bg-status-upcoming',
  },
  [AlertSeverity.CRITICAL]: {
    border: 'border-status-missed/40',
    bg: 'bg-status-missed/10',
    icon: '🚨',
    dot: 'bg-status-missed',
  },
}

interface AlertBannerProps {
  alert: Alert
  onAction?: () => void
  className?: string
}

export function AlertBanner({ alert, onAction, className = '' }: AlertBannerProps) {
  const { dismissAlert, markAlertRead } = useAppStore()
  const config = severityConfig[alert.severity]

  const timeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'À l\'instant'
    if (mins < 60) return `Il y a ${mins}min`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `Il y a ${hrs}h`
    return `Il y a ${Math.floor(hrs / 24)}j`
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`rounded-xl border ${config.border} ${config.bg} p-4 ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Pulse dot */}
        <div className="flex-shrink-0 mt-1">
          {!alert.read ? (
            <span className="relative flex h-2.5 w-2.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.dot}`} />
            </span>
          ) : (
            <span className={`inline-flex rounded-full h-2.5 w-2.5 bg-white/20`} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-white leading-tight">
              {config.icon} {alert.title}
            </p>
            <button
              onClick={() => dismissAlert(alert.id)}
              className="flex-shrink-0 text-slate-500 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.message}</p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-500">{timeAgo(alert.timestamp)}</span>
            {alert.actionLabel && (
              <button
                onClick={() => {
                  markAlertRead(alert.id)
                  onAction?.()
                }}
                className="text-xs font-medium text-medical-blue hover:text-medical-teal transition-colors underline underline-offset-2"
              >
                {alert.actionLabel} →
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Alert Panel (list of alerts) ─────────────────────────────
interface AlertPanelProps {
  alerts: Alert[]
  maxVisible?: number
  className?: string
}

export function AlertPanel({ alerts, maxVisible = 5, className = '' }: AlertPanelProps) {
  const visible = alerts.slice(0, maxVisible)

  if (alerts.length === 0) {
    return (
      <div className={`rounded-xl border border-white/5 bg-navy-800/50 p-8 text-center ${className}`}>
        <div className="text-3xl mb-2">✅</div>
        <p className="text-sm text-slate-400">Aucune alerte active</p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence>
        {visible.map((alert) => (
          <AlertBanner key={alert.id} alert={alert} />
        ))}
      </AnimatePresence>
      {alerts.length > maxVisible && (
        <p className="text-xs text-center text-slate-500 pt-1">
          + {alerts.length - maxVisible} autres alertes
        </p>
      )}
    </div>
  )
}

// ── Toast Notification ────────────────────────────────────────
interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose: () => void
}

export function Toast({ message, type = 'success', onClose }: ToastProps) {
  const colors = {
    success: 'bg-status-taken border-status-taken/40 text-white',
    error: 'bg-status-missed/90 border-status-missed/40 text-white',
    info: 'bg-medical-blue/90 border-medical-blue/40 text-white',
  }
  const icons = { success: '✓', error: '✕', info: 'ℹ' }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl ${colors[type]}`}
    >
      <span className="text-base font-bold">{icons[type]}</span>
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  )
}
