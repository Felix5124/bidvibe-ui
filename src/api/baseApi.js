// API base configuration with Axios and interceptors
import axios from 'axios'
import { logHttpError } from '../lib/logger'

// Base URL from environment or default to localhost
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Create Axios instance
const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    // Prefer Supabase JWT token, fallback to existing authToken.
    const token = sessionStorage.getItem('sb_jwt') || sessionStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    logHttpError('API', error)
    return Promise.reject(error)
  }
)

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    logHttpError('API', error)
    return Promise.reject(error)
  }
)

export default api
