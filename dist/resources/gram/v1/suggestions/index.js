"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const accept_1 = __importDefault(require("./accept"));
const list_1 = __importDefault(require("./list"));
const reject_1 = __importDefault(require("./reject"));
const reset_1 = __importDefault(require("./reset"));
exports.default = (dal) => ({
    accept: (0, accept_1.default)(dal),
    list: (0, list_1.default)(dal),
    reject: (0, reject_1.default)(dal),
    reset: (0, reset_1.default)(dal),
});
//# sourceMappingURL=index.js.map