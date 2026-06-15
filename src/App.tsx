// ============================================================
// MédiSync — Root Application Component
// ============================================================

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './core/store/useAppStore'
import { usePillboxStore } from './core/store/usePillboxStore'
import { useWebSocket } from './core/hooks/useWebSocket'
import { Header } from './components/ui/Header'
import { Hub } from './scenes/Hub'
import { PatientView } from './components/roles/PatientView'
import { CarerView } from './components/roles/CarerView'
import { PharmacistView } from './components/roles/PharmacistView'
import { DoctorView } from './components/roles/DoctorView'

// ── Scene Transition Variants ─────────────────────────────────
const sceneVariants = {
  initial: { opacity: 0, y: 16, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.99 },
}

const sceneTransition = { duration: 0.3, ease: [0.4, 0, 0.2, 1] }

// ── Scene Router ──────────────────────────────────────────────
function SceneRouter() {
  const { activeScene } = useAppStore()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeScene}
        variants={sceneVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={sceneTransition}
        className="w-full"
      >
        {activeScene === 'hub' && <Hub />}
        {activeScene === 'patient' && <PatientView />}
        {activeScene === 'carer' && <CarerView />}
        {activeScene === 'pharmacist' && <PharmacistView />}
        {activeScene === 'doctor' && <DoctorView />}
      </motion.div>
    </AnimatePresence>
  )
}

// ── Backend offline banner ────────────────────────────────────
function BackendBanner() {
  const { isConnectedToBackend, error } = usePillboxStore()
  if (isConnectedToBackend || !error) return null
  return (
    <motion.div
      initial={{ y: -40 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-status-missed/90 backdrop-blur-sm px-4 py-2 text-center text-sm font-medium text-white"
    >
      ⚠️ {error}
    </motion.div>
  )
}

// ── Loading Screen ────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-navy-900 flex flex-col items-center justify-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 rounded-full border-2 border-medical-blue/20 border-t-medical-blue"
      />
      <p className="text-slate-400 text-sm">Connexion au pilulier MédiSync...</p>
    </div>
  )
}

// ── Root App ──────────────────────────────────────────────────
export default function App() {
  const { loadAll, handleWsEvent, isLoading } = usePillboxStore()
  const { loadAlerts, addAlert } = useAppStore()

  // Bootstrap: load all data from API on mount
  useEffect(() => {
    loadAll()
    loadAlerts()
  }, [])

  // WebSocket: real-time device events
  useWebSocket({
    onMessage: (msg) => {
      handleWsEvent(msg.event, msg.payload)

      // If a new alert was created by the simulator, refresh alerts
      if (msg.event === 'alert_created') {
        const a = msg.payload as any
        addAlert({
          id: a.id,
          type: a.type,
          severity: a.severity,
          title: a.title,
          message: a.message,
          timestamp: a.timestamp,
          forRoles: a.forRoles,
          read: false,
          actionLabel: null,
        })
      }

      // On device sync, reload device state every 5 ticks (2.5 min)
      if (msg.event === 'device_synced') {
        // lightweight update already handled in store
      }
    },
    onConnect: () => console.log('[App] WebSocket connected'),
    onDisconnect: () => console.log('[App] WebSocket disconnected'),
  })

  if (isLoading) return <LoadingScreen />

  return (
    <div className="min-h-screen bg-navy-900 text-slate-100">
      <BackendBanner />
      <Header />
      <main>
        <SceneRouter />
      </main>
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(0, 180, 216, 0.06) 0%, transparent 60%)',
        }}
      />
    </div>
  )
}
