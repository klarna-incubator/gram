"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Notification = void 0;
class Notification {
    constructor(templateKey, variables) {
        this.templateKey = templateKey;
        this.variables = variables;
        this.type = "email";
        this.status = "new";
    }
}
exports.Notification = Notification;
//# sourceMappingURL=Notification.js.map