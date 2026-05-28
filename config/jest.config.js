/** @type {import('@jest/types').Config.InitialOptions} */
const config = {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  verbose: true,
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "./tsconfig.json",
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  coverageProvider: "v8",
  transformIgnorePatterns: ["<rootDir>/node_modules/"],
  globalSetup: "./jest.globalSetup.js",
  setupFilesAfterEnv: ["./jest.setup.ts"],
};
export default config;
