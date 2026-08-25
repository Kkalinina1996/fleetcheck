import { addVehicle, getVehicleById as findStoredVehicleById, getVehicleByPlateNumber, getVehicles, updateVehicle as updateStoredVehicle } from '../lib/storage'
import { normalizePlateNumber } from '../data/vehicles'

export const getAllVehicles = () => getVehicles()
export const getVehicleById = (id) => findStoredVehicleById(id)
export const findVehicleByPlate = (plateNumber) => getVehicleByPlateNumber(normalizePlateNumber(plateNumber))
export const findCompanyVehicleByPlate = (companyId, plateNumber) => getAllVehicles().find((vehicle) => vehicle.companyId === companyId && vehicle.plateNumber === normalizePlateNumber(plateNumber))
export const getCompanyVehicles = (companyId) => getAllVehicles().filter((vehicle) => vehicle.ownerType === 'company' && vehicle.companyId === companyId)
export const createVehicle = (vehicle) => addVehicle({
  plateNumber: vehicle.plateNumber,
  driverName: vehicle.driverName,
  brand: vehicle.brand,
  model: vehicle.model,
  year: vehicle.year,
  ownerType: vehicle.ownerType,
  companyId: vehicle.companyId,
  vehicleType: vehicle.vehicleType,
})
export const updateVehicle = (vehicleId, updates) => updateStoredVehicle(vehicleId, Object.fromEntries(Object.entries({
  plateNumber: updates.plateNumber ? normalizePlateNumber(updates.plateNumber) : undefined,
  brand: updates.brand,
  model: updates.model,
  year: updates.year,
  vehicleType: updates.vehicleType,
}).filter(([, value]) => value !== undefined)))
