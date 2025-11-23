module.exports = {
  projects: [
    {
      displayName: 'main',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/tests'],
      testMatch: ['**/tests/**/*.test.ts'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@main/(.*)$': '<rootDir>/src/main/$1',
        '^@renderer/(.*)$': '<rootDir>/src/renderer/src/$1'
      },
      transform: {
        '^.+\\.ts$': [
          'ts-jest',
          {
            tsconfig: {
              esModuleInterop: true
            }
          }
        ]
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
    },
    {
      displayName: 'renderer',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/src/renderer/src'],
      testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx)', '**/*.(test|spec).(ts|tsx)'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@main/(.*)$': '<rootDir>/src/main/$1',
        '^@renderer/(.*)$': '<rootDir>/src/renderer/src/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
      },
      transform: {
        '^.+\\.(ts|tsx)$': [
          'ts-jest',
          {
            tsconfig: {
              jsx: 'react',
              esModuleInterop: true
            }
          }
        ]
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
    }
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/main/**/*.ts',
    'src/renderer/src/**/*.{ts,tsx}',
    '!src/main/index.ts',
    '!src/main/database.ts',
    '!src/renderer/src/main.tsx',
    '!**/*.d.ts',
    '!**/__tests__/**'
  ]
}
