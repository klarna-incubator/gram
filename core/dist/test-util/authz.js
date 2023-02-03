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
exports.testAuthzProvider = exports.genUser = void 0;
const authorization_1 = require("../auth/authorization");
const Role_1 = require("../auth/models/Role");
const sampleUser_1 = require("./sampleUser");
const system_1 = require("./system");
const genUser = (user) => (Object.assign(Object.assign({}, sampleUser_1.sampleUser), user));
exports.genUser = genUser;
// Maybe this should be the default?
class TestAuthzProvider {
    constructor() {
        this.key = "test";
    }
    getPermissionsForSystem(ctx, systemId, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (user.roles.length === 0)
                return [];
            if (user.roles.find((r) => r === Role_1.Role.Admin))
                return authorization_1.AllPermissions;
            const permissions = [];
            if (user.roles.find((r) => r === Role_1.Role.Reviewer)) {
                permissions.push(authorization_1.Permission.Read, authorization_1.Permission.Review);
            }
            if (user.roles.find((r) => r === Role_1.Role.User)) {
                permissions.push(authorization_1.Permission.Read);
            }
            const system = yield (0, system_1.getMockedSystemById)(systemId);
            if (user.teams.find((t) => { var _a; return (_a = system === null || system === void 0 ? void 0 : system.owners) === null || _a === void 0 ? void 0 : _a.find((o) => o.id === t.id); })) {
                permissions.push(authorization_1.Permission.Write, authorization_1.Permission.Delete);
            }
            // console.log(permissions);
            return permissions;
        });
    }
    getPermissionsForStandaloneModel(ctx, model, user) {
        return __awaiter(this, void 0, void 0, function* () {
            if (model.systemId &&
                model.systemId != "00000000-0000-0000-0000-000000000000") {
                return this.getPermissionsForSystem(ctx, model.systemId, user);
            }
            if (user.roles.length === 0)
                return [];
            if (user.roles.find((r) => r === Role_1.Role.Admin))
                return authorization_1.AllPermissions;
            const permissions = [];
            if (user.roles.find((r) => r === Role_1.Role.Reviewer)) {
                permissions.push(authorization_1.Permission.Read, authorization_1.Permission.Review);
            }
            if (user.roles.find((r) => r === Role_1.Role.User)) {
                permissions.push(authorization_1.Permission.Read);
            }
            if (model.createdBy === user.sub) {
                permissions.push(authorization_1.Permission.Read, authorization_1.Permission.Write, authorization_1.Permission.Delete);
            }
            // console.log(permissions);
            return permissions;
        });
    }
}
exports.testAuthzProvider = new TestAuthzProvider();
//# sourceMappingURL=authz.js.map