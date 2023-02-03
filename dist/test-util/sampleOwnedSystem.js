"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleOwnedSystem = void 0;
const System_1 = __importDefault(require("@gram/core/dist/data/systems/System"));
const sampleTeam_1 = require("./sampleTeam");
exports.sampleOwnedSystem = new System_1.default("mocked-system-id", "mocked system", "Mocked System", [sampleTeam_1.sampleTeam], "system description");
//# sourceMappingURL=sampleOwnedSystem.js.map