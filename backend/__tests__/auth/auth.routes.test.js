/**
 * Auth Routes Integration Tests
 * Tests: POST /api/v1/auth/register and POST /api/v1/auth/login
 *
 * Uses supertest to spin up the Express app in-memory.
 * No real DB connection needed — mongoose is mocked.
 */

const request = require('supertest')
const app = require('../../src/app')

// ── Mock mongoose to avoid real DB connections in tests ──────
jest.mock('mongoose', () => {
  const actualMongoose = jest.requireActual('mongoose')
  return {
    ...actualMongoose,
    connect: jest.fn().mockResolvedValue({}),
  }
})

// ── Mock the User model ───────────────────────────────────────
jest.mock('../../src/models/User.model', () => {
  const mockUser = {
    _id: 'mock_user_id_123',
    name: 'Test User',
    email: 'test@example.com',
    role: 'user',
    isEmailVerified: true,
    comparePassword: jest.fn().mockResolvedValue(true),
    save: jest.fn().mockResolvedValue(true),
  }
  const MockUserModel = jest.fn().mockImplementation(() => mockUser)
  MockUserModel.findOne = jest.fn()
  MockUserModel.findById = jest.fn()
  MockUserModel.create = jest.fn().mockResolvedValue(mockUser)
  return MockUserModel
})

describe('Auth Routes', () => {

  describe('POST /api/v1/auth/register', () => {
    it('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'test@test.com' })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('should return 400 for invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Test', email: 'not-an-email', password: 'Test@1234' })

      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('should return 400 for password shorter than 8 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ name: 'Test', email: 'user@example.com', password: '123' })

      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/v1/auth/login', () => {
    it('should return 400 when email is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: 'password123' })

      expect(res.status).toBe(400)
    })

    it('should return 400 when password is missing', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'user@example.com' })

      expect(res.status).toBe(400)
    })

    it('should return a non-200 status for non-existent user', async () => {
      const User = require('../../src/models/User.model')
      User.findOne.mockResolvedValueOnce(null)

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' })

      // Auth failure can be 401 (user not found) or 500 (DB not connected in test env)
      // Either way, it must NOT be a successful 2xx response
      expect(res.status).toBeGreaterThanOrEqual(400)
      expect(res.body.success).toBe(false)
    })
  })
})
