import { beforeAll, afterAll } from 'vitest'

// Global test setup
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
})

afterAll(() => {
  // Cleanup after all tests
})
