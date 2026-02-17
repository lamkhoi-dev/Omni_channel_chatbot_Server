const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000'

let ws = null
let reconnectTimer = null

export function connectWebSocket(businessId, onMessage) {
  if (ws) {
    ws.close()
  }

  const url = `${WS_URL}/ws/${businessId}`
  ws = new WebSocket(url)

  ws.onopen = () => {
    console.log('WebSocket connected')
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (err) {
      console.error('Failed to parse WS message:', err)
    }
  }

  ws.onclose = () => {
    console.log('WebSocket disconnected, reconnecting in 3s...')
    reconnectTimer = setTimeout(() => {
      connectWebSocket(businessId, onMessage)
    }, 3000)
  }

  ws.onerror = (err) => {
    console.error('WebSocket error:', err)
  }

  return ws
}

export function disconnectWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (ws) {
    ws.close()
    ws = null
  }
}
