import process from 'node:process'

export function notFoundHandler(req, res) {
  return res.status(404).json({ error: 'Route not found' })
}

export function errorHandler(error, req, res, next) {
  void next
  if (process.env.NODE_ENV !== 'production') {
    console.error(error.message)
  }

  const statusCode = Number.isInteger(error.statusCode) ? error.statusCode : 500
  const message = statusCode >= 500 ? 'Internal server error' : error.message
  return res.status(statusCode).json({ error: message })
}
