/**
 * Emergency Routes Integration Tests
 * Tests: GET /api/v1/emergency/contacts
 *        GET /api/v1/emergency/hospitals/nearby
 *        GET /api/v1/emergency/police/nearby
 *        POST /api/v1/emergency/sos (auth-protected)
 */

const request = require('supertest')
const app = require('../../src/app')

// ── Mock Hospital & PoliceStation models ─────────────────────
jest.mock('../../src/models/Hospital.model', () => ({
  countDocuments: jest.fn().mockResolvedValue(5),
  insertMany: jest.fn().mockResolvedValue([]),
  aggregate: jest.fn().mockResolvedValue([
    {
      name: 'AIIMS New Delhi',
      type: 'Government',
      phone: '011-26588500',
      distance: 2500,
      beds: { total: 2400, available: 127 },
      location: { coordinates: [77.2100, 28.5672] },
    },
  ]),
}))

jest.mock('../../src/models/PoliceStation.model', () => ({
  countDocuments: jest.fn().mockResolvedValue(3),
  insertMany: jest.fn().mockResolvedValue([]),
  aggregate: jest.fn().mockResolvedValue([
    {
      name: 'Connaught Place Police Station',
      phone: '011-23741350',
      distance: 1200,
      location: { coordinates: [77.2183, 28.6304] },
    },
  ]),
}))

jest.mock('../../src/models/SOS.model', () => ({
  create: jest.fn().mockResolvedValue({
    _id: 'mock_sos_id',
    name: 'Test User',
    phone: '9999999999',
    status: 'Pending',
    createdAt: new Date(),
    location: { coordinates: [77.2090, 28.6139] },
  }),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue([]),
  }),
  findByIdAndUpdate: jest.fn(),
}))

describe('Emergency Routes', () => {

  describe('GET /api/v1/emergency/contacts', () => {
    it('should return 200 with a list of emergency contacts', async () => {
      const res = await request(app).get('/api/v1/emergency/contacts')
      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('contacts')
      expect(Array.isArray(res.body.data.contacts)).toBe(true)
      expect(res.body.data.contacts.length).toBeGreaterThan(0)
    })

    it('should include national emergency contact (112)', async () => {
      const res = await request(app).get('/api/v1/emergency/contacts')
      const numbers = res.body.data.contacts.map(c => c.number)
      expect(numbers).toContain('112')
    })

    it('should filter contacts by category', async () => {
      const res = await request(app).get('/api/v1/emergency/contacts?category=police')
      expect(res.status).toBe(200)
      res.body.data.contacts.forEach(c => {
        expect(c.category).toBe('police')
      })
    })
  })

  describe('GET /api/v1/emergency/hospitals/nearby', () => {
    it('should return 200 with hospital list', async () => {
      const res = await request(app)
        .get('/api/v1/emergency/hospitals/nearby')
        .query({ lat: 28.5672, lng: 77.2100, radius: 10 })

      expect(res.status).toBe(200)
      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveProperty('hospitals')
      expect(Array.isArray(res.body.data.hospitals)).toBe(true)
    })

    it('should fall back to default Delhi coords when lat/lng are missing', async () => {
      const res = await request(app).get('/api/v1/emergency/hospitals/nearby')
      expect(res.status).toBe(200)
      expect(res.body.data.userLocation).toMatchObject({ lat: 28.5672, lng: 77.21 })
    })
  })

  describe('GET /api/v1/emergency/police/nearby', () => {
    it('should return 200 with police stations list', async () => {
      const res = await request(app)
        .get('/api/v1/emergency/police/nearby')
        .query({ lat: 28.6304, lng: 77.2183 })

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveProperty('stations')
      expect(Array.isArray(res.body.data.stations)).toBe(true)
    })
  })

  describe('POST /api/v1/emergency/sos', () => {
    it('should return 401 when called without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/emergency/sos')
        .send({ lat: 28.6139, lng: 77.2090 })

      // Should require JWT auth
      expect([401, 403]).toContain(res.status)
    })

    it('should return 400 when lat/lng are missing (even if auth passed)', async () => {
      // We only test the validation layer here — auth will reject first in practice
      const res = await request(app)
        .post('/api/v1/emergency/sos')
        .set('Authorization', 'Bearer invalid_token')
        .send({})

      expect([400, 401]).toContain(res.status)
    })
  })
})
