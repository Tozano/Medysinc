// ============================================================
// MédiSync — WebSocket Server
// ============================================================

import { WebSocketServer, WebSocket } from 'ws'
import type { WsEvent } from './types.js'

let wss: WebSocketServer | null = null
const clients = new Set<WebSocket>()

export function createWsServer(port: number) {
  wss = new WebSocketServer({ port })

  wss.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`[WS] Port ${port} already in use. Kill the old process and restart.`)
      process.exit(1)
    }
    console.error('[WS] Server error:', err.message)
  })

  wss.on('connection', (ws, req) => {
    clients.add(ws)
    const ip = req.socket.remoteAddress
    console.log(`[WS] Client connected (${ip}) — ${clients.size} total`)

    // Send welcome + current state
    ws.send(JSON.stringify({
      event: 'connected',
      payload: { message: 'MédiSync device feed connected', clientCount: clients.size },
      timestamp: new Date().toISOString(),
    }))

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString())
        handleClientMessage(ws, msg)
      } catch {
        // ignore malformed messages
      }
    })

    ws.on('close', () => {
      clients.delete(ws)
      console.log(`[WS] Client disconnected — ${clients.size} remaining`)
    })

    ws.on('error', (err) => {
      console.error('[WS] Socket error:', err.message)
      clients.delete(ws)
    })
  })

  console.log(`[WS] WebSocket server listening on ws://localhost:${port}`)
  return wss
}

// Broadcast to all connected clients
export function broadcast(event: WsEvent) {
  if (!wss || clients.size === 0) return
  const msg = JSON.stringify(event)
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg)
    }
  }
}

// Handle incoming messages from frontend (if needed)
function handleClientMessage(ws: WebSocket, msg: Record<string, unknown>) {
  // Ping/pong keepalive
  if (msg.event === 'ping') {
    ws.send(JSON.stringify({ event: 'pong', payload: {}, timestamp: new Date().toISOString() }))
  }
}
