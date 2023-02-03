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
exports.lookupUsers = exports.lookupUser = exports.setUserProvider = exports.userProvider = void 0;
const logger_1 = require("../logger");
class DefaultUserProvider {
    constructor() {
        this.key = "default";
    }
    lookup(ctx, userIds) {
        throw new Error("Method not implemented.");
    }
}
const log = (0, logger_1.getLogger)("userLookup");
exports.userProvider = new DefaultUserProvider();
function setUserProvider(newUserProvider) {
    exports.userProvider = newUserProvider;
}
exports.setUserProvider = setUserProvider;
function lookupUser(ctx, sub) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield lookupUsers(ctx, [sub]);
            if (result.length === 0)
                return null;
            return result[0];
        }
        catch (err) {
            log.warn(`Errored while trying to look up user: ${sub}`, err);
            return null;
        }
    });
}
exports.lookupUser = lookupUser;
function lookupUsers(ctx, subs) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield exports.userProvider.lookup(ctx, subs);
        }
        catch (err) {
            log.warn(`Errored while trying to look up users: ${subs}`, err);
            return [];
        }
    });
}
exports.lookupUsers = lookupUsers;
//# sourceMappingURL=user.js.map