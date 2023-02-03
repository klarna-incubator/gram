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
exports.testSystemProvider = exports.getMockedSystemById = void 0;
const sampleOwnedSystem_1 = require("./sampleOwnedSystem");
const systems = [sampleOwnedSystem_1.sampleOwnedSystem];
function getMockedSystemById(systemId) {
    return __awaiter(this, void 0, void 0, function* () {
        return systems.find((s) => s.id === systemId) || null;
    });
}
exports.getMockedSystemById = getMockedSystemById;
class TestSystemProvider {
    constructor() {
        this.key = "test";
    }
    getSystem(ctx, systemId) {
        return __awaiter(this, void 0, void 0, function* () {
            return getMockedSystemById(systemId);
        });
    }
    listSystems(ctx, input, pagination) {
        return __awaiter(this, void 0, void 0, function* () {
            return { systems, total: systems.length };
        });
    }
}
exports.testSystemProvider = new TestSystemProvider();
//# sourceMappingURL=system.js.map