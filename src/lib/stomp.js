import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const WS_URL = API_URL + '/ws'
const ENABLE_STOMP = import.meta.env.VITE_ENABLE_STOMP === 'true'

const createNoopClient = () => ({
  subscribe: () => ({ unsubscribe: () => {} }),
  deactivate: () => {},
})

export function createStompClient({ onConnect, onStompError, onWebSocketError } = {}) {
  if (!ENABLE_STOMP) {
    return createNoopClient()
  }

  const client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 4000,
    onConnect,
    onStompError,
    onWebSocketError,
  })

  client.activate()
  return client
}
