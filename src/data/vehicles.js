const plateNumbers = []

export const seedVehicles = plateNumbers.map((plateNumber, index) => ({
  id: `veh_${String(index + 1).padStart(3, '0')}`,
  plateNumber,
}))

export const normalizePlateNumber = (plateNumber) => plateNumber.trim().toUpperCase().replace(/\s+/g, ' ')
export const vehicles = seedVehicles
