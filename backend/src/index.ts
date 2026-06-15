// ============================================================
// MédiSync — Backend Server
// Express REST API + WebSocket + Pill Dispenser Simulator
// ============================================================

import express from 'express'
import cors from 'cors'
import { loadDb, isSeeded } from './db/database.js'
import { seed } from './db/seed.js'
import { createWsServer } from './ws.js'
import { startSimulator } from './services/pillboxSimulator.js'
import { deviceRouter } from './routes/device.js'
import { compartmentsRouter } from './routes/compartments.js'
import { historyRouter } from './routes/history.js'
import { alertsRouter } from './routes/alerts.js'
import { patientsRouter } from './routes/patients.js'
import { refillsRouter } from './routes/refills.js'

const PORT = 4001
const WS_PORT = 4002

const app = express()
app.use(cors({ origin: ['http://localhost:5173', 'http://127.0.0.1:5173'] }))
app.use(express.json())
app.use((req, _res, next) => {
  console.log(`[API] ${new Date().toLocaleTimeString('fr-FR')} ${req.method} ${req.path}`)
  next()
})

app.use('/api/device', deviceRouter)
app.use('/api/compartments', compartmentsRouter)
app.use('/api/history', historyRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/patients', patientsRouter)
app.use('/api/refills', refillsRouter)

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', version: '1.0.0', time: new Date().toISOString() })
)

// Bootstrap
loadDb()
if (!isSeeded()) {
  console.log('[Bootstrap] Empty DB — seeding...')
  seed()
}

createWsServer(WS_PORT)
startSimulator()

const server = app.listen(PORT, () => {
  console.log('')
  console.log('  ╔══════════════════════════════════════╗')
  console.log('  ║    MédiSync Backend v1.0.0            ║')
  console.log('  ╠══════════════════════════════════════╣')
  console.log(`  ║  REST API  → http://localhost:${PORT}   ║`)
  console.log(`  ║  WebSocket → ws://localhost:${WS_PORT}   ║`)
  console.log('  ║  Simulator → actif (30s ticks)        ║')
  console.log('  ╚══════════════════════════════════════╝')
  console.log('')
})

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[API] Port ${PORT} already in use. Kill the old process and restart.`)
    process.exit(1)
  }
  throw err
})
