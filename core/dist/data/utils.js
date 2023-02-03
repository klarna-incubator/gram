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
exports._deleteAllTheThings = void 0;
const logger_1 = require("../logger");
const log = (0, logger_1.getLogger)("UtilsDataService");
function _deleteAllTheThings(pool) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.NODE_ENV !== "test") {
            log.warn("Attempted to _deleteAllTheThings in a non-test environment.");
            return;
        }
        yield pool.query("TRUNCATE TABLE mitigations CASCADE");
        yield pool.query("TRUNCATE TABLE controls CASCADE");
        yield pool.query("TRUNCATE TABLE threats CASCADE");
        yield pool.query("TRUNCATE TABLE reviews CASCADE");
        yield pool.query("TRUNCATE TABLE user_activity CASCADE");
        yield pool.query("TRUNCATE TABLE notifications CASCADE");
        yield pool.query("TRUNCATE TABLE suggested_controls CASCADE");
        yield pool.query("TRUNCATE TABLE suggested_threats CASCADE");
        yield pool.query("DELETE FROM models");
    });
}
exports._deleteAllTheThings = _deleteAllTheThings;
//# sourceMappingURL=utils.js.map