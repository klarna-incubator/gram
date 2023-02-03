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
exports.CurrentAuthz = void 0;
const authorization_1 = require("../auth/authorization");
const AuthzError_1 = require("../auth/AuthzError");
const Checks_1 = require("./Checks");
/**
 * Current User's Authorization. Interface on the GramRequest level to
 * check for authorization.
 */
class CurrentAuthz {
    constructor(req, dal) {
        this.req = req;
        this.dal = dal;
        this.user = req.user;
        this.dal = dal;
        this.check = new Checks_1.Checks(req.user);
    }
    any(...roles) {
        if (!this.check.any(...roles))
            throw new AuthzError_1.AuthzError(`required any role: ${roles}, but user had roles ${this.user.roles}`);
    }
    all(...roles) {
        if (!this.check.all(...roles))
            throw new AuthzError_1.AuthzError(`required all role: ${roles}, but user had roles ${this.user.roles}`);
    }
    is(role) {
        if (!this.check.is(role))
            throw new AuthzError_1.AuthzError(`required role: ${role}, but user had roles ${this.user.roles}`);
    }
    hasPermissionsForModelId(modelId, ...expectedPermissions) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, authorization_1.hasPermissionsForModelId)({ currentRequest: this.req }, this.dal, modelId, this.user, expectedPermissions);
        });
    }
    hasAnyPermissionsForModelId(modelId, ...anyOfThesePermissions) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, authorization_1.hasAnyPermissionsForModelId)({ currentRequest: this.req }, this.dal, modelId, this.user, anyOfThesePermissions);
        });
    }
    hasPermissionsForModel(model, ...expectedPermissions) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, authorization_1.hasPermissionsForModel)({ currentRequest: this.req }, model, this.user, expectedPermissions);
        });
    }
    hasPermissionsForSystemId(systemId, ...expectedPermissions) {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, authorization_1.hasPermissionsForSystemId)({ currentRequest: this.req }, systemId, this.user, expectedPermissions);
        });
    }
    getPermissionsForModel(model) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield (0, authorization_1.getPermissionsForModel)({ currentRequest: this.req }, model, this.user);
        });
    }
}
exports.CurrentAuthz = CurrentAuthz;
//# sourceMappingURL=CurrentAuthz.js.map