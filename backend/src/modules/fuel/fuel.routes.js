const express = require('express')
const { asyncWrapper } = require('../../middleware/errorHandler')
const ApiResponse = require('../../utils/apiResponse')
const FuelPrice = require('../../models/FuelPrice.model')

const router = express.Router()

// Seeded fuel data for all 28 states + 3 UTs (as of May 2026 approximate values)
const SEED_FUEL_DATA = [
  { stateCode: 'AP', stateName: 'Andhra Pradesh',     petrol: 107.65, diesel: 94.62 },
  { stateCode: 'AR', stateName: 'Arunachal Pradesh',  petrol: 90.68,  diesel: 80.48 },
  { stateCode: 'AS', stateName: 'Assam',              petrol: 94.63,  diesel: 81.63 },
  { stateCode: 'BR', stateName: 'Bihar',              petrol: 104.67, diesel: 91.17 },
  { stateCode: 'CG', stateName: 'Chhattisgarh',       petrol: 98.85,  diesel: 87.51 },
  { stateCode: 'GA', stateName: 'Goa',                petrol: 95.18,  diesel: 86.78 },
  { stateCode: 'GJ', stateName: 'Gujarat',            petrol: 94.65,  diesel: 90.02 },
  { stateCode: 'HR', stateName: 'Haryana',            petrol: 94.23,  diesel: 87.26 },
  { stateCode: 'HP', stateName: 'Himachal Pradesh',   petrol: 94.50,  diesel: 82.37 },
  { stateCode: 'JH', stateName: 'Jharkhand',          petrol: 94.49,  diesel: 87.41 },
  { stateCode: 'KA', stateName: 'Karnataka',          petrol: 101.94, diesel: 87.89 },
  { stateCode: 'KL', stateName: 'Kerala',             petrol: 107.85, diesel: 96.63 },
  { stateCode: 'MP', stateName: 'Madhya Pradesh',     petrol: 107.23, diesel: 90.87 },
  { stateCode: 'MH', stateName: 'Maharashtra',        petrol: 103.44, diesel: 89.97 },
  { stateCode: 'MN', stateName: 'Manipur',            petrol: 98.10,  diesel: 88.39 },
  { stateCode: 'ML', stateName: 'Meghalaya',          petrol: 93.32,  diesel: 85.87 },
  { stateCode: 'MZ', stateName: 'Mizoram',            petrol: 97.60,  diesel: 88.72 },
  { stateCode: 'NL', stateName: 'Nagaland',           petrol: 96.67,  diesel: 88.12 },
  { stateCode: 'OD', stateName: 'Odisha',             petrol: 101.59, diesel: 95.31 },
  { stateCode: 'PB', stateName: 'Punjab',             petrol: 96.72,  diesel: 85.72 },
  { stateCode: 'RJ', stateName: 'Rajasthan',          petrol: 108.97, diesel: 94.00 },
  { stateCode: 'SK', stateName: 'Sikkim',             petrol: 99.69,  diesel: 83.17 },
  { stateCode: 'TN', stateName: 'Tamil Nadu',         petrol: 100.75, diesel: 92.46 },
  { stateCode: 'TS', stateName: 'Telangana',          petrol: 107.54, diesel: 95.65 },
  { stateCode: 'TR', stateName: 'Tripura',            petrol: 97.80,  diesel: 85.72 },
  { stateCode: 'UP', stateName: 'Uttar Pradesh',      petrol: 94.75,  diesel: 87.82 },
  { stateCode: 'UK', stateName: 'Uttarakhand',        petrol: 94.87,  diesel: 88.55 },
  { stateCode: 'WB', stateName: 'West Bengal',        petrol: 104.95, diesel: 91.76 },
  { stateCode: 'DL', stateName: 'Delhi',              petrol: 94.72,  diesel: 87.62 },
  { stateCode: 'JK', stateName: 'Jammu & Kashmir',   petrol: 94.50,  diesel: 80.87 },
  { stateCode: 'LA', stateName: 'Ladakh',             petrol: 90.52,  diesel: 78.21 },
]

/**
 * GET /api/v1/fuel
 * Get current fuel prices for all states
 */
router.get('/', asyncWrapper(async (req, res) => {
  // Try DB first, fall back to seed data
  let prices = await FuelPrice.find()
    .sort({ stateCode: 1, effectiveDate: -1 })
    .lean()

  if (prices.length === 0) {
    // Return seed data with today's date
    prices = SEED_FUEL_DATA.map((d) => ({
      ...d,
      petrol: { price: d.petrol, change: 0, changePercent: 0 },
      diesel: { price: d.diesel, change: 0, changePercent: 0 },
      effectiveDate: new Date(),
      source: 'manual',
    }))
  }

  const avgPetrol = (prices.reduce((s, p) => s + (p.petrol?.price || p.petrol), 0) / prices.length).toFixed(2)
  const avgDiesel = (prices.reduce((s, p) => s + (p.diesel?.price || p.diesel), 0) / prices.length).toFixed(2)

  return ApiResponse.success(res, {
    message: 'Fuel prices fetched successfully',
    data: {
      prices,
      summary: {
        avgPetrol: parseFloat(avgPetrol),
        avgDiesel: parseFloat(avgDiesel),
        lastUpdated: new Date(),
        totalStates: prices.length,
      },
    },
  })
}))

/**
 * GET /api/v1/fuel/:stateCode
 * Get fuel price for a specific state
 */
router.get('/:stateCode', asyncWrapper(async (req, res) => {
  const { stateCode } = req.params
  const stateData = SEED_FUEL_DATA.find((s) => s.stateCode === stateCode.toUpperCase())
  if (!stateData) {
    return ApiResponse.error(res, { message: 'State not found', statusCode: 404 })
  }

  return ApiResponse.success(res, {
    data: {
      ...stateData,
      petrol: { price: stateData.petrol, change: 0 },
      diesel: { price: stateData.diesel, change: 0 },
      lastUpdated: new Date(),
    },
  })
}))

module.exports = router
