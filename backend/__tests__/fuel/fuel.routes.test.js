/**
 * Fuel Routes Integration Tests
 * Tests: GET /api/v1/fuel
 *        GET /api/v1/fuel/:stateCode
 *        GET /api/v1/fuel/:stateCode/history
 */

const request = require('supertest')
const app = require('../../src/app')

// ── Mock FuelPrice model ─────────────────────────────────────
jest.mock('../../src/models/FuelPrice.model', () => ({
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([]), // Empty DB → falls back to seed data
  }),
}))

describe('Fuel Routes', () => {

  describe('GET /api/v1/fuel', () => {
    it('should return 200 with price data for all states', async () => {
      const res = await request(app).get('/api/v1/fuel')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('prices')
      expect(Array.isArray(res.body.data.prices)).toBe(true)
      expect(res.body.data.prices.length).toBeGreaterThanOrEqual(28)
    })

    it('should include a summary with avgPetrol and avgDiesel', async () => {
      const res = await request(app).get('/api/v1/fuel')
      expect(res.body.data).toHaveProperty('summary')
      expect(typeof res.body.data.summary.avgPetrol).toBe('number')
      expect(typeof res.body.data.summary.avgDiesel).toBe('number')
    })

    it('should return petrol price above ₹80 for all states', async () => {
      const res = await request(app).get('/api/v1/fuel')
      res.body.data.prices.forEach(p => {
        const price = p.petrol?.price || p.petrol
        expect(price).toBeGreaterThan(80)
      })
    })
  })

  describe('GET /api/v1/fuel/:stateCode', () => {
    it('should return 200 for a valid state code (DL)', async () => {
      const res = await request(app).get('/api/v1/fuel/DL')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('stateName')
      expect(res.body.data.stateCode).toBe('DL')
    })

    it('should return 404 for an invalid state code', async () => {
      const res = await request(app).get('/api/v1/fuel/XX')
      expect(res.status).toBe(404)
      expect(res.body.success).toBe(false)
    })

    it('should return petrol and diesel prices for MH (Maharashtra)', async () => {
      const res = await request(app).get('/api/v1/fuel/MH')
      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('petrol')
      expect(res.body.data).toHaveProperty('diesel')
    })
  })

  describe('GET /api/v1/fuel/:stateCode/history', () => {
    it('should return 200 with 7 historical data points for DL', async () => {
      const FuelPrice = require('../../src/models/FuelPrice.model')
      // Simulate empty DB history → triggers seeded generation
      FuelPrice.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      })

      const res = await request(app).get('/api/v1/fuel/DL/history')
      expect(res.status).toBe(200)
      expect(Array.isArray(res.body.data)).toBe(true)
      expect(res.body.data.length).toBe(7)
    })

    it('should return data with date, petrol, diesel fields', async () => {
      const res = await request(app).get('/api/v1/fuel/MH/history')
      expect(res.status).toBe(200)
      res.body.data.forEach(entry => {
        expect(entry).toHaveProperty('date')
        expect(entry).toHaveProperty('petrol')
        expect(entry).toHaveProperty('diesel')
      })
    })

    it('should return 404 for an unknown state history', async () => {
      const res = await request(app).get('/api/v1/fuel/ZZ/history')
      expect(res.status).toBe(404)
    })
  })
})
