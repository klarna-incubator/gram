"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentClassHandler = exports.isComponentClass = exports.ComponentTypes = void 0;
const log4js_1 = require("log4js");
exports.ComponentTypes = ["process", "datastore", "external"];
/**
 * Guard function to check if object is of type ComponentClass
 * @param o object to check
 */
function isComponentClass(o) {
    return ("id" in o &&
        "name" in o &&
        "componentType" in o &&
        (exports.ComponentTypes.includes(o.componentType) || o.componentType === "any"));
}
exports.isComponentClass = isComponentClass;
/**
 * ComponentClassHandler is a naïve in-memory static interface to fetch component classes from.
 */
class ComponentClassHandler {
    constructor() {
        this.lookup = new Map();
        exports.ComponentTypes.forEach((ct) => this.lookup.set(ct, []));
        this.log = (0, log4js_1.getLogger)("ComponentClassHandler");
    }
    search(type, searchStr) {
        return this.lookup
            .get(type)
            .filter((t) => t.name.toLowerCase().includes(searchStr.toLowerCase()));
    }
    add(cls) {
        var _a;
        if (cls.componentType === "any") {
            exports.ComponentTypes.forEach((ct) => { var _a; return (_a = this.lookup.get(ct)) === null || _a === void 0 ? void 0 : _a.push(cls); });
        }
        else {
            (_a = this.lookup.get(cls.componentType)) === null || _a === void 0 ? void 0 : _a.push(cls);
        }
    }
}
exports.ComponentClassHandler = ComponentClassHandler;
//# sourceMappingURL=index.js.map