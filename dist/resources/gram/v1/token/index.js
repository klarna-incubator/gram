"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const csrf_1 = __importDefault(require("./csrf"));
const delete_1 = __importDefault(require("./delete"));
const get_1 = __importDefault(require("./get"));
const params_1 = __importDefault(require("./params"));
const tokenV1 = {
    csrf: csrf_1.default,
    get: get_1.default,
    delete: delete_1.default,
    params: params_1.default,
};
exports.default = tokenV1;
//# sourceMappingURL=index.js.map