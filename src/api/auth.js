// Authentication APIs
// POST /api/auth/register - Register new user
// POST /api/auth/login - Login user
// POST /api/auth/refresh - Refresh token
// POST /api/auth/logout - Logout user

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'
const authApi = axios.create({
  baseURL: `${BASE_URL}/api/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Register a new user
 * @param {Object} data - {email, password, name, phoneNumber}
 */
export const register = (data) => {
  return authApi.post('/register', data)
}

/**
 * Login user
 * @param {Object} data - {email, password}
 */
export const login = (data) => {
  return authApi.post('/login', data)
}

/**
 * Refresh authentication token
 */
export const refreshToken = () => {
  const token = localStorage.getItem('authToken')
  return authApi.post('/refresh', {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

/**
 * Logout user
 */
export const logout = () => {
  const token = localStorage.getItem('authToken')
  return authApi.post('/logout', {}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

// Store auth token after login
export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token)
  authApi.defaults.headers.common.Authorization = `Bearer ${token}`
}

// Remove auth token on logout
export const removeAuthToken = () => {
  localStorage.removeItem('authToken')
  delete authApi.defaults.headers.common.Authorization
}

export default authApi
