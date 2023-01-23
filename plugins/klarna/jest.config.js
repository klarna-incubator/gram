module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["src"],
  setupFilesAfterEnv: ["./jest.setup.js"],
  transform: {
    ".ts": [
      "ts-jest",
      {
        isolatedModules: true,
        /* ts-jest config goes here in Jest */
        // {
        //   isolatedModules: true,
        // }
      },
    ],
  },
};
