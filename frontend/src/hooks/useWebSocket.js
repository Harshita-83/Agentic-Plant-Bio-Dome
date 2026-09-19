import { useEffect, useRef, useState, useCallback } from 'react'
import { WS_URL } from '../services/api'

export function useWebSocket(onMessage) {
  const ws = useRef(null)
  const [connected, setConnected] = useState(false)
  const reconnectTimer = useRef(null)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!mountedRef.current) return
    try {
      ws.current = new WebSocket(WS_URL)

      ws.current.onopen = () => {
        setConnected(true)
      }

      ws.current.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          onMessage(data)
        } catch {}
      }

      ws.current.onclose = () => {
        setConnected(false)
        if (mountedRef.current) {
          reconnectTimer.current = setTimeout(connect, 3000)
        }
      }

      ws.current.onerror = () => {
        ws.current?.close()
      }
    } catch {
      reconnectTimer.current = setTimeout(connect, 3000)
    }
  }, [onMessage])

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [connect])

  return connected
}
