// ============================================================
// MédiSync — Medication Timeline / History Component
// ============================================================

import { HistoryEntry, CompartmentState, TimeSlot } from '../../core/types'

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

const STATE_CONFIG: Record<CompartmentState, { color: string; bg: string; border: string; label: string; icon: string }> = {
  [CompartmentState.TAKEN]: {
    color: 'text-status-taken',
    bg: 'bg-status-taken/15',
    border: 'border-status-taken/30',
    label: 'Prise',
    icon: '✓',
  },
  [CompartmentState.MISSED]: {
    color: 'text-status-missed',
    bg: 'bg-status-missed/15',
    border: 'border-status-missed/30',
    label: 'Oubliée',
    icon: '✕',
  },
  [CompartmentState.READY]: {
    color: 'text-medical-blue',
    bg: 'bg-medical-blue/15',
    border: 'border-medical-blue/30',
    label: 'En attente',
    icon: '◎',
  },
  [CompartmentState.LOCKED]: {
    color: 'text-slate-500',
    bg: 'bg-slate-700/30',
    border: 'border-slate-600/30',
    label: 'Verrouillé',
    icon: '🔒',
  },
  [CompartmentState.OPEN]: {
    color: 'text-medical-teal',
    bg: 'bg-medical-teal/15',
    border: 'border-medical-teal/30',
    label: 'Ouvert',
    icon: '⬡',
  },
}

// ── Format helpers ────────────────────────────────────────────
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
  if (date.toDateString() === yesterday.toDateString()) return 'Hier'

  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

const formatTime = (isoStr: string): string =>
  new Date(isoStr).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

// ── Single Timeline Entry ─────────────────────────────────────
interface TimelineEntryProps {
  entry: HistoryEntry
  isLast: boolean
}

function TimelineEntry({ entry, isLast }: TimelineEntryProps) {
  const config = STATE_CONFIG[entry.state]
  const delay = entry.takenAt
    ? (() => {
        const [sh, sm] = entry.scheduledTime.split(':').map(Number)
        const scheduled = new Date(entry.date)
        scheduled.setHours(sh, sm)
        const taken = new Date(entry.takenAt)
        const diffMins = Math.round((taken.getTime() - scheduled.getTime()) / 60000)
        if (diffMins <= 0) return null
        if (diffMins < 60) return `+${diffMins}min`
        return `+${Math.floor(diffMins / 60)}h${diffMins % 60 > 0 ? String(diffMins % 60).padStart(2, '0') : ''}`
      })()
    : null

  return (
    <div className="flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${config.bg} ${config.border} ${config.color} flex-shrink-0`}
        >
          {config.icon}
        </div>
        {!isLast && <div className="w-px flex-1 bg-white/5 my-1" />}
      </div>

      {/* Content */}
      <div className={`pb-5 ${isLast ? '' : ''}`}>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">{SLOT_ICONS[entry.slot]}</span>
          <span className="text-sm font-medium text-white">{SLOT_LABELS[entry.slot]}</span>
          <span className={`text-xs font-medium ${config.color}`}>• {config.label}</span>
          {delay && (
            <span className="text-xs text-slate-500 italic">{delay} de retard</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Prévu {entry.scheduledTime}
            {entry.takenAt && ` → Pris ${formatTime(entry.takenAt)}`}
          </span>
        </div>

        {/* Medications */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {entry.medications.map((med) => (
            <span
              key={med.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-navy-700/60 border border-white/5 text-xs text-slate-300"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: med.color }}
              />
              {med.name} {med.dosage}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Daily Group ───────────────────────────────────────────────
interface DayGroupProps {
  date: string
  entries: HistoryEntry[]
}

function DayGroup({ date, entries }: DayGroupProps) {
  const takenCount = entries.filter((e) => e.state === CompartmentState.TAKEN).length
  const total = entries.length
  const pct = total > 0 ? Math.round((takenCount / total) * 100) : 0

  return (
    <div>
      {/* Day header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px bg-white/5" />
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {formatDate(date)}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              pct === 100
                ? 'bg-status-taken/20 text-status-taken'
                : pct >= 75
                ? 'bg-status-upcoming/20 text-status-upcoming'
                : 'bg-status-missed/20 text-status-missed'
            }`}
          >
            {takenCount}/{total} prises
          </span>
        </div>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Entries */}
      <div>
        {entries.map((entry, i) => (
          <TimelineEntry key={entry.id} entry={entry} isLast={i === entries.length - 1} />
        ))}
      </div>
    </div>
  )
}

// ── Main Timeline ─────────────────────────────────────────────
interface TimelineProps {
  entries: HistoryEntry[]
  maxDays?: number
  className?: string
}

export function Timeline({ entries, maxDays = 7, className = '' }: TimelineProps) {
  // Group by date
  const grouped: Record<string, HistoryEntry[]> = {}
  entries.forEach((entry) => {
    if (!grouped[entry.date]) grouped[entry.date] = []
    grouped[entry.date].push(entry)
  })

  const sortedDates = Object.keys(grouped)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, maxDays)

  if (entries.length === 0) {
    return (
      <div className={`text-center py-10 ${className}`}>
        <p className="text-slate-400 text-sm">Aucun historique disponible</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {sortedDates.map((date) => (
        <DayGroup key={date} date={date} entries={grouped[date]} />
      ))}
    </div>
  )
}

// ── Compact Weekly Grid ───────────────────────────────────────
interface WeeklyGridProps {
  adherenceData: { day: string; taken: number; missed: number; total: number }[]
  className?: string
}

export function WeeklyAdherenceGrid({ adherenceData, className = '' }: WeeklyGridProps) {
  return (
    <div className={`grid grid-cols-7 gap-1.5 ${className}`}>
      {adherenceData.map((d) => {
        const pct = d.total > 0 ? d.taken / d.total : 0
        const color =
          pct === 1
            ? 'bg-status-taken/80'
            : pct >= 0.5
            ? 'bg-status-upcoming/70'
            : d.total === 0
            ? 'bg-navy-700/50'
            : 'bg-status-missed/60'

        return (
          <div key={d.day} className="flex flex-col items-center gap-1.5">
            <div
              className={`w-full aspect-square rounded-lg ${color} transition-all`}
              title={`${d.day}: ${d.taken}/${d.total}`}
            />
            <span className="text-xs text-slate-500 font-medium">{d.day}</span>
          </div>
        )
      })}
    </div>
  )
}
