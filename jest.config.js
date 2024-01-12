module.exports = {
  collectCoverageFrom: ['src/**/*.ts', '!src/**/index.ts'],
  coverageReporters: ['lcov', 'text', 'text-summary'],
  preset: 'ts-jest',
  testEnvironment: 'node',
};