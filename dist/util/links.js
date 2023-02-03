"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.linkToModel = void 0;
const config_1 = __importDefault(require("config"));
function trimEndSlash(s) {
    return s.endsWith("/") ? s.substr(0, s.length - 1) : s;
}
function linkToModel(modelId) {
    const origins = config_1.default.get("origin");
    if (!origins || (Array.isArray(origins) && origins.length === 0)) {
        throw new Error("Couldn't find cors origin for generating model link");
    }
    if (Array.isArray(origins)) {
        return `${trimEndSlash(origins[0])}/model/${modelId}`;
    }
    else {
        return `${trimEndSlash(origins)}/model/${modelId}`;
    }
}
exports.linkToModel = linkToModel;
//# sourceMappingURL=links.js.map