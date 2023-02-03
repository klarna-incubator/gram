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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.selfCheck = void 0;
const express_physical_1 = __importDefault(require("express-physical"));
function selfCheck(done) {
    return __awaiter(this, void 0, void 0, function* () {
        done(express_physical_1.default.response({
            name: "@gram/api-self",
            actionable: true,
            healthy: true,
            type: express_physical_1.default.type.SELF,
        }));
    });
}
exports.selfCheck = selfCheck;
//# sourceMappingURL=selfCheck.js.map