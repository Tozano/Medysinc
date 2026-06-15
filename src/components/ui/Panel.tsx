// ============================================================
// MédiSync — Reusable Glass Panel
// ============================================================

import { motion, HTMLMotionProps } from 'framer-motion'
import { ReactNode } from 'react'

interface PanelProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  title?: string
  subtitle?: string
  className?: string
  variant?: 'default' | 'elevated' | 'bordered' | 'alert'
  icon?: ReactNode
  action?: ReactNode
  noPadding?: boolean
}

const variantClasses = {
  default: 'bg-navy-800/90 border border-white/5',
  elevated: 'bg-navy-700/90 border border-medical-blue/20 shadow-[0_0_30px_rgba(0,180,216,0.08)]',
  bordered: 'bg-navy-800/80 border-2 border-medical-blue/40',
  alert: 'bg-red-950/60 border border-status-missed/40',
}

export function Panel({
  children,
  title,
  subtitle,
  className = '',
  variant = 'default',
  icon,
  action,
  noPadding = false,
  ...motionProps
}: PanelProps) {
  return (
    <motion.div
      className={`rounded-2xl backdrop-blur-sm ${variantClasses[variant]} ${noPadding ? '' : 'p-6'} ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      {...motionProps}
    >
      {(title || action) && (
        <div className={`flex items-start justify-between gap-4 ${noPadding ? 'px-6 pt-6' : 'mb-5'}`}>
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-medical-blue/15 flex items-center justify-center text-medical-blue">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && (
                <h3 className="text-base font-semibold text-white leading-tight truncate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      <div className={noPadding && (title || action) ? 'px-6 pb-6' : ''}>
        {children}
      </div>
    </motion.div>
  )
}

// ── Status Badge ─────────────────────────────────────────────
interface StatusBadgeProps {
  state: string
  className?: string
}

const badgeConfig: Record<string, { label: string; class: string }> = {
  taken: { label: 'Prise', class: 'bg-status-taken/20 text-status-taken border-status-taken/30' },
  missed: { label: 'Oubliée', class: 'bg-status-missed/20 text-status-missed border-status-missed/30' },
  ready: { label: 'À prendre', class: 'bg-status-ready/20 text-status-ready border-status-ready/30' },
  locked: { label: 'Verrouillé', class: 'bg-status-locked/20 text-slate-400 border-status-locked/30' },
  open: { label: 'Ouvert', class: 'bg-medical-teal/20 text-medical-teal border-medical-teal/30' },
}

export function StatusBadge({ state, className = '' }: StatusBadgeProps) {
  const config = badgeConfig[state] ?? { label: state, class: 'bg-white/10 text-white border-white/20' }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.class} ${className}`}
    >
      {config.label}
    </span>
  )
}

// ── Stat Card ────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: ReactNode
  color?: string
  trend?: 'up' | 'down' | 'neutral'
  trendLabel?: string
  className?: string
}

export function StatCard({
  label,
  value,
  unit,
  icon,
  color = 'text-medical-blue',
  trend,
  trendLabel,
  className = '',
}: StatCardProps) {
  const trendColor =
    trend === 'up' ? 'text-status-taken' : trend === 'down' ? 'text-status-missed' : 'text-slate-400'
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'

  return (
    <div
      className={`bg-navy-700/60 rounded-xl p-4 border border-white/5 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </span>
        {icon && <span className={`${color} opacity-70`}>{icon}</span>}
      </div>
      <div className="flex items-end gap-1.5">
        <span className={`text-2xl font-bold ${color}`}>{value}</span>
        {unit && <span className="text-sm text-slate-400 mb-0.5">{unit}</span>}
      </div>
      {trendLabel && (
        <p className={`text-xs mt-1 ${trendColor}`}>
          {trendIcon} {trendLabel}
        </p>
      )}
    </div>
  )
}
