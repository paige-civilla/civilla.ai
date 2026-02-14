module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/server", "<rootDir>/tests"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  moduleNameMapper: {
    "^@shared/(.*)$": "<rootDir>/shared/$1",
  },
  collectCoverageFrom: [
    "server/**/*.ts",
    "!server/**/*.d.ts",
    "!server/**/index.ts",
  ],
  coveragePathIgnorePatterns: ["/node_modules/", "/dist/"],
};
