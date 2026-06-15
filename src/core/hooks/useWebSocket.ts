// ============================================================
// MédiSync — WebSocket Hook (real-time device events)
// ============================================================

import { useEffect, useRef, useCallback } from 'react'

const WS_URL = 'ws://localhost:4002'

export type WsEventType =
  | 'compartment_state_changed'
  | 'alert_created'
  | 'stock_updated'
  | 'device_synced'
  | 'take_confirmed'
  | 'connected'
  | 'pong'

export interface WsMessage {
  event: WsEventType
  payload: Record<string, unknown>
  timestamp: string
}

type EventHandler = (msg: WsMessage) => void

interface UseWebSocketOptions {
  onMessage?: EventHandler
  onConnect?: () => void
  onDisconnect?: () => void
  reconnectDelay?: number
}

export function useWebSocket({
  onMessage,
  onConnect,
  onDisconnect,
  reconnectDelay = 3000,
}: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    const ws = new WebSocket(WS_URL)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[WS] Connected to MédiSync device feed')
      onConnect?.()
    }

    ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data)
        onMessage?.(msg)
      } catch {
        // ignore malformed
      }
    }

    ws.onclose = () => {
      console.log('[WS] Disconnected — reconnecting in', reconnectDelay, 'ms')
      onDisconnect?.()
      if (mountedRef.current) {
        reconnectTimerRef.current = setTimeout(connect, reconnectDelay)
      }
    }

    ws.onerror = () => {
      ws.close()
    }
  }, [onMessage, onConnect, onDisconnect, reconnectDelay])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  const send = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, payload }))
    }
  }, [])

  return { send }
}
