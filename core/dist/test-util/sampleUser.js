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
exports.testUserProvider = exports.sampleAdmin = exports.sampleReviewer = exports.sampleOtherUser = exports.sampleUser = void 0;
const Role_1 = require("../auth/models/Role");
const sampleTeam_1 = require("./sampleTeam");
exports.sampleUser = {
    sub: "test@abc.xyz",
    roles: [Role_1.Role.User],
    teams: [sampleTeam_1.sampleTeam],
};
exports.sampleOtherUser = {
    sub: "other@abc.xyz",
    roles: [Role_1.Role.User],
    teams: [sampleTeam_1.sampleOtherTeam],
};
exports.sampleReviewer = {
    sub: "reviewer@abc.xyz",
    roles: [Role_1.Role.Reviewer],
    teams: [sampleTeam_1.sampleOtherTeam],
};
exports.sampleAdmin = {
    sub: "admin@abc.xyz",
    roles: [Role_1.Role.Admin],
    teams: [{ name: "admin team", id: "1337" }],
};
const users = [exports.sampleUser, exports.sampleOtherUser, exports.sampleReviewer, exports.sampleAdmin];
class TestUserProvider {
    constructor() {
        this.key = "default";
    }
    lookup(ctx, userIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return userIds
                .map((uid) => users.find((u) => u.sub === uid))
                .filter((u) => u);
        });
    }
}
exports.testUserProvider = new TestUserProvider();
//# sourceMappingURL=sampleUser.js.map