"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Checks = void 0;
class Checks {
    constructor(user) {
        this.user = user;
    }
    any(...roles) {
        if (roles.length === 0)
            return true;
        for (let i = 0; i < roles.length; i++) {
            if (this.user.roles.indexOf(roles[i]) > -1)
                return true;
        }
        return false;
    }
    all(...roles) {
        return roles.every((role) => this.is(role));
    }
    is(role) {
        return this.user.roles.includes(role);
    }
}
exports.Checks = Checks;
//# sourceMappingURL=Checks.js.map