"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @exports systemsV1
 */
const list_1 = __importDefault(require("./list"));
const get_1 = __importDefault(require("./get"));
const permissions_1 = __importDefault(require("./permissions"));
const systemsV1 = (dal) => ({
    list: (0, list_1.default)(dal),
    get: get_1.default,
    permission: permissions_1.default,
});
exports.default = systemsV1;
//# sourceMappingURL=index.js.map