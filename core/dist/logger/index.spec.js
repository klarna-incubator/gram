"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = __importDefault(require("config"));
const configGet = jest.spyOn(config_1.default, "get");
configGet.mockImplementation((key) => {
    if (key === "log.layout")
        return "json";
    if (key === "log.level")
        return "DEBUG";
});
const index_1 = require("./index");
describe("log4js logger implementation", () => {
    /**
     * No intensive tests since this is direct call to log4js.getLogger
     */
    describe("getLogger", () => {
        it("should not throw any error", () => {
            expect.assertions(1);
            const log = (0, index_1.getLogger)("sample");
            log.debug("test");
            log.debug({ obj: "sample" });
            expect(log).toBeTruthy();
        });
    });
});
afterAll(() => {
    configGet.mockRestore();
});
//# sourceMappingURL=index.spec.js.map