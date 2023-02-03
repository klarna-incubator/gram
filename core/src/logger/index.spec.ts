import config from "config";
const configGet = jest.spyOn(config, "get");

configGet.mockImplementation((key) => {
  if (key === "log.layout") return "json";
  if (key === "log.level") return "DEBUG";
});

import { getLogger } from "./index";

describe("log4js logger implementation", () => {
  /**
   * No intensive tests since this is direct call to log4js.getLogger
   */
  describe("getLogger", () => {
    it("should not throw any error", () => {
      expect.assertions(1);
      const log = getLogger("sample");
      log.debug("test");
      log.debug({ obj: "sample" });
      expect(log).toBeTruthy();
    });
  });
});

afterAll(() => {
  configGet.mockRestore();
});
