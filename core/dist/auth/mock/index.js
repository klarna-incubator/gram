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
const Role_1 = require("../models/Role");
class MockAuthProvider {
    constructor() {
        this.key = "mock";
    }
    params(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            return {};
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getIdentity(ctx) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                sub: "payload",
                roles: [Role_1.Role.User],
                teams: [{ name: "mocked team", id: "41" }],
            };
        });
    }
}
exports.default = MockAuthProvider;
//# sourceMappingURL=index.js.map