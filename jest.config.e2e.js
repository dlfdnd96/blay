module.exports = {
  setupFiles: ['<rootDir>/.jest/setEnvVars.js'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
  ],
  verbose: true,
  testTimeout: 10000,
};
