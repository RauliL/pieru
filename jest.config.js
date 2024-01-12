module.exports = {
  collectCoverageFrom: ['src/*.ts'],
  coverageReporters: ['lcov', 'text', 'text-summary'],
  preset: 'ts-jest',
  testEnvironment: 'node',
};
