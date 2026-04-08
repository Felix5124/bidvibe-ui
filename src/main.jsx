import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { logError } from './lib/logger'

// Catch unexpected runtime errors globally.
window.addEventListener('error', (event) => {
  logError('Runtime', 'Unhandled window error', event.error || new Error(event.message), {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  })
})

// Catch unhandled async promise rejections globally.
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
  logError('Runtime', 'Unhandled promise rejection', reason)
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
