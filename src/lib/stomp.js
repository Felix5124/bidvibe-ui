import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client/dist/sockjs'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const WS_URL = API_URL + '/ws'

export function createStompClient({ onConnect, onStompError, onWebSocketError } = {}) {
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
