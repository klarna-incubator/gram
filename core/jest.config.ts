import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["src"],
  globalSetup: "./jest.globalSetup.ts",
  setupFilesAfterEnv: ["./jest.setup.ts"],
  transform: {
    ".*\\.spec\\.ts": [
      "ts-jest",
      {
        isolatedModules: true,
      },
    ],
  },
};

export default config;
