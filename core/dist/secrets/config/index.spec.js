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
const errors_1 = require("../errors");
const index_1 = require("./index");
const secrets = new index_1.ConfigSecretProvider();
describe("Secrets from config module", () => {
    it("should throw error on unset config tag", () => __awaiter(void 0, void 0, void 0, function* () {
        expect(secrets.get("unknown.config.tag")).rejects.toThrow(errors_1.InvalidSecretError);
    }));
    it("should return valid set config value", () => __awaiter(void 0, void 0, void 0, function* () {
        const secret = yield secrets.get("__sample");
        expect(secret).toBe("test");
    }));
});
//# sourceMappingURL=index.spec.js.map