import { addVehicle, getVehicleById as findStoredVehicleById, getVehicleByPlateNumber, getVehicles } from '../lib/storage'
import { normalizePlateNumber } from '../data/vehicles'

export const getAllVehicles = () => getVehicles()
export const getVehicleById = (id) => findStoredVehicleById(id)
export const findVehicleByPlate = (plateNumber) => getVehicleByPlateNumber(normalizePlateNumber(plateNumber))
export const findCompanyVehicleByPlate = (companyId, plateNumber) => getAllVehicles().find((vehicle) => vehicle.companyId === companyId && vehicle.plateNumber === normalizePlateNumber(plateNumber))
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
