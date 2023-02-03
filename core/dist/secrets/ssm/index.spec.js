"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const errors_1 = require("../errors");
const aws_sdk_1 = require("./__mocks__/aws-sdk");
const secrets = new _1.SSMSecretProvider();
const getParameterError = jest.fn().mockReturnValue({
    promise: jest.fn().mockRejectedValue("error"),
});
const getParameterSuccess = jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue({
        Parameter: {
            Value: "test",
        },
    }),
});
describe("Secrets from AWS ssm", () => {
    jest.mock("aws-sdk");
    const OLD_ENV = process.env;
    beforeAll(() => {
        aws_sdk_1.getParameterFn.mockClear();
        process.env.PARAMETER_SECRET_PATH = "/test/valid";
    });
    it("should append proper ssm prefix based on config", () => __awaiter(void 0, void 0, void 0, function* () {
        aws_sdk_1.getParameterFn.mockImplementation(getParameterSuccess);
        const secret = yield secrets.get("name.something");
        const arg = getParameterSuccess.mock.calls[0][0];
        expect(arg.Name).toBe("/test/valid/name.something");
    }));
    it("should error from unset ssm path", () => __awaiter(void 0, void 0, void 0, function* () {
        aws_sdk_1.getParameterFn.mockImplementation(getParameterError);
        expect(secrets.get("some.bad.path")).rejects.toThrow(errors_1.InvalidSecretError);
    }));
    it("should return valid value from ssm path", () => __awaiter(void 0, void 0, void 0, function* () {
        aws_sdk_1.getParameterFn.mockImplementation(getParameterSuccess);
        const secret = yield secrets.get("valid.path");
        expect(secret).toBe("test");
    }));
    afterAll(() => {
        process.env = OLD_ENV; // restore old env
        jest.restoreAllMocks();
    });
});
//# sourceMappingURL=index.spec.js.map