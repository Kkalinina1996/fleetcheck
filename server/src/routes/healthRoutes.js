import { Router } from 'express'

const healthRoutes = Router()

healthRoutes.get('/', (req, res) => {
  res.json({ ok: true, service: 'FleetCheck API' })
})

export default healthRoutes
