import 'dotenv/config'
import process from 'node:process'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js'
import authRoutes from './src/routes/authRoutes.js'
import dashboardRoutes from './src/routes/dashboardRoutes.js'
import healthRoutes from './src/routes/healthRoutes.js'
import notificationRoutes from './src/routes/notificationRoutes.js'
import privateRoutes from './src/routes/privateRoutes.js'
import reportRoutes from './src/routes/reportRoutes.js'
import vehicleRoutes from './src/routes/vehicleRoutes.js'

const app = express()
const port = Number(process.env.PORT) || 4000
const configuredOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim().replace(/\/$/, '')).filter(Boolean)
const localOrigin = 'http://localhost:5173'
const allowedOrigins = process.env.NODE_ENV === 'production' ? configuredOrigins : [...new Set([...configuredOrigins, localOrigin])]

app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true)
    return callback(new Error('Origin is not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Vehicle-Id', 'X-Report-Id'],
}))
app.use(express.json())
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/private', privateRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

app.listen(port, () => {
  console.log(`FleetCheck API listening on port ${port}`)
})
