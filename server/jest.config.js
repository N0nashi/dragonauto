module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.js"],
  setupFiles: ["./jest.setup.js"],
  resetMocks: true,          // очищает очередь mockResolvedValueOnce перед каждым тестом
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  coveragePathIgnorePatterns: ["/node_modules/", "/coverage/"],
  verbose: true,
};
