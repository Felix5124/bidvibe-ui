// src/lib/base.ts
import axios from 'axios'
import { Client } from '@stomp/stompjs'
import { logError, logHttpError } from './logger'

// ======================
// Constants & Types
// ======================

// Base URL BE
export const BASE_URL = 'http://localhost:8080'

// Các hằng số bảo mật đồng bộ với BE
export const SecurityConstants = {
  AUTH_HEADER: 'Authorization',
  BEARER_PREFIX: 'Bearer ',
  WS_ENDPOINT: '/ws',
}

// Wrapper response chung từ BE
export interface ApiResponse<T> {
  success: boolean
  errorCode?: number
  message: string
  data: T
}

// Wrapper phân trang chung từ BE
export interface PageResponse<T> {
  content: T[]
  meta: {
    page: number
    size: number
    totalElements: number
    totalPages: number
  }
}

// User tối thiểu cho FE
export interface User {
  id: string
  email: string
  name?: string
  role?: 'USER' | 'ADMIN'
  isBanned?: boolean
  isMuted?: boolean
  googleAvatar?: string
}

// Auction tối thiểu cho FE
export interface Auction {
  id: string
  itemId: string
  sessionId: string
  status: 'PENDING' | 'ACTIVE' | 'PAUSED' | 'FINISHED'
  currentPrice: number
  buyNowPrice?: number
  createdAt: string
  endsAt?: string
}

// ======================
// Axios Instance
// ======================

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

// Lấy JWT từ sessionStorage hoặc cookie
const getJwt = (): string | null => {
  // Ưu tiên sessionStorage
  const fromStorage = sessionStorage.getItem('sb_jwt')
  if (fromStorage) return fromStorage

  // Fallback cookie (ví dụ: sb_jwt=...)
  const match = document.cookie.match(/(?:^|;\s*)sb_jwt=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

// Gắn Authorization header tự động cho mọi request
apiClient.interceptors.request.use((config) => {
  const token = getJwt()
  if (token) {
    config.headers = config.headers || {}
    config.headers[SecurityConstants.AUTH_HEADER] =
      SecurityConstants.BEARER_PREFIX + token
  }
  return config
})

// Trả về thẳng response.data (ApiResponse)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    logHttpError('ApiClient', error)

    // Handle 401 - redirect to login
    if (error.response?.status === 401) {
      logError('Auth', 'apiClient received 401, clearing session', error)
      sessionStorage.removeItem('authToken')
      sessionStorage.removeItem('sb_jwt')
      sessionStorage.removeItem('user')
      window.dispatchEvent(new CustomEvent('auth:logout'))
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ======================
// WebSocket Helper (STOMP)
// ======================

export class StompWS {
  private client: Client

  constructor() {
    // Khởi tạo client kết nối tới /ws
    this.client = new Client({
      brokerURL: `${BASE_URL}${SecurityConstants.WS_ENDPOINT}`,
      reconnectDelay: 3000, // Tự động reconnect
    })
  }

  // Kết nối websocket
  connect(onConnected?: () => void) {
    this.client.onConnect = () => {
      // Callback khi kết nối thành công
      if (onConnected) onConnected()
    }
    this.client.activate()
  }

  // Đăng ký lắng nghe topic
  subscribeTopic(topic: string, callback: (msg: string) => void) {
    // Ví dụ topic: /topic/auction/{id}/chat
    return this.client.subscribe(topic, (message) => {
      callback(message.body)
    })
  }

  // Gửi message lên server
  sendMessage(destination: string, body: unknown) {
    // Ví dụ destination: /app/auction/{id}/chat
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    })
  }

  // Ngắt kết nối nếu cần
  disconnect() {
    this.client.deactivate()
  }
}
