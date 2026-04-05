import axios from 'axios'
import { logHttpError } from './logger'

export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const SecurityConstants = {
  AUTH_HEADER: 'Authorization',
  BEARER_PREFIX: 'Bearer ',
}

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
})

const getJwt = () => {
  const fromStorage = sessionStorage.getItem('sb_jwt')
  if (fromStorage) return fromStorage

  const match = document.cookie.match(/(?:^|;\s*)sb_jwt=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

apiClient.interceptors.request.use((config) => {
  const userStr = sessionStorage.getItem('user')
  if (userStr) {
    try {
      const user = JSON.parse(userStr)
      if (user.isBanned) {
        console.warn('Blocking API request for banned user:', config.url)
        return Promise.reject(new Error('User is banned'))
      }
    } catch {
      // Ignore JSON parse errors
    }
  }

  const token = getJwt()
  if (token) {
    config.headers = config.headers || {}
    config.headers[SecurityConstants.AUTH_HEADER] =
      SecurityConstants.BEARER_PREFIX + token
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    logHttpError('ApiClient', error)
    return Promise.reject(error)
  }
)
