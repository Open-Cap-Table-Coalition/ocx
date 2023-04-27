/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  moduleNameMapper: {
    "^src((/.*)|)$": "<rootDir>/src$1",
    "^test((/.*)|)$": "<rootDir>/test$1",
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  preset: "ts-jest",
  testEnvironment: "node",
  resetMocks: true,
  restoreMocks: true,
};
