import { createMocks } from 'node-mocks-http'
import handler from '@/app/api/auth/signup/route'

// Mock the database client
jest.mock('@/lib/database/neon-client', () => ({
  query: jest.fn(),
}))

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed_password'),
  compare: jest.fn().mockResolvedValue(true),
}))

// Mock email service
jest.mock('@/lib/email/email-service', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
}))

describe('/api/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should create a new user successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        role: 'tester',
      },
    })

    // Mock successful database operations
    const mockQuery = require('@/lib/database/neon-client').query
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // No existing user
      .mockResolvedValueOnce({ 
        rows: [{ 
          id: '123', 
          email: 'test@example.com', 
          name: 'Test User',
          role: 'tester' 
        }] 
      }) // User created

    await handler(req, res)

    expect(res._getStatusCode()).toBe(201)
    const data = JSON.parse(res._getData())
    expect(data.message).toBe('User created successfully')
    expect(data.user.email).toBe('test@example.com')
  })

  it('should return error for existing user', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
        role: 'tester',
      },
    })

    // Mock existing user
    const mockQuery = require('@/lib/database/neon-client').query
    mockQuery.mockResolvedValueOnce({ 
      rows: [{ id: '123', email: 'existing@example.com' }] 
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toBe('User already exists')
  })

  it('should validate required fields', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        // Missing password, name, and role
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toContain('required')
  })

  it('should validate email format', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User',
        role: 'tester',
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toContain('email')
  })

  it('should validate password strength', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        email: 'test@example.com',
        password: '123', // Too short
        name: 'Test User',
        role: 'tester',
      },
    })

    await handler(req, res)

    expect(res._getStatusCode()).toBe(400)
    const data = JSON.parse(res._getData())
    expect(data.error).toContain('password')
  })
})
