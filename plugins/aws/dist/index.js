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
const path_1 = require("path");
const classes_json_1 = __importDefault(require("./classes.json"));
const component_classes_1 = require("@gram/core/dist/data/component-classes");
class AWSPlugin {
    bootstrap(reg) {
        return __awaiter(this, void 0, void 0, function* () {
            reg.registerAssets("aws", (0, path_1.join)(__dirname, "assets"));
            reg.registerComponentClasses(classes_json_1.default.filter(component_classes_1.isComponentClass));
        });
    }
}
exports.default = AWSPlugin;
//# sourceMappingURL=index.js.map