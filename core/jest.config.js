module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["src"],
  setupFilesAfterEnv: ["./jest.setup.js"],
  globals: {
    "ts-jest": {
      isolatedModules: true,
    },
  },
};
