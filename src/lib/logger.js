// Centralized logging helpers for consistent FE diagnostics.

export const logInfo = (scope, message, meta) => {
  if (meta !== undefined) {
    console.info(`[${scope}] ${message}`, meta)
    return
  }
  console.info(`[${scope}] ${message}`)
}

export const logWarn = (scope, message, meta) => {
  if (meta !== undefined) {
    console.warn(`[${scope}] ${message}`, meta)
    return
  }
  console.warn(`[${scope}] ${message}`)
}

export const logError = (scope, message, error, meta) => {
  const payload = {
    message,
    errorMessage: error?.message,
    stack: error?.stack,
    ...(meta || {}),
  }
  console.error(`[${scope}] ${message}`, payload)
}

// HTTP-specific logger to print request/response context for easier debugging.
export const logHttpError = (scope, error) => {
  const config = error?.config || {}
  const response = error?.response || {}
  console.error(`[${scope}] HTTP request failed`, {
    method: config.method,
    url: config.url,
    baseURL: config.baseURL,
    status: response.status,
    statusText: response.statusText,
    requestData: config.data,
    params: config.params,
    responseData: response.data,
  })
}
