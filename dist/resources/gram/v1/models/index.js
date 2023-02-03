"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const create_1 = __importDefault(require("./create"));
const delete_1 = __importDefault(require("./delete"));
const get_1 = __importDefault(require("./get"));
const templates_1 = __importDefault(require("./templates"));
const list_1 = __importDefault(require("./list"));
const patch_1 = __importDefault(require("./patch"));
const permissions_1 = __importDefault(require("./permissions"));
const setTemplate_1 = __importDefault(require("./setTemplate"));
exports.default = (service) => ({
    list: (0, list_1.default)(service),
    get: (0, get_1.default)(service),
    create: (0, create_1.default)(service),
    patch: (0, patch_1.default)(service),
    delete: (0, delete_1.default)(service),
    permissions: (0, permissions_1.default)(service),
    templates: (0, templates_1.default)(service),
    setTemplate: (0, setTemplate_1.default)(service),
});
//# sourceMappingURL=index.js.map