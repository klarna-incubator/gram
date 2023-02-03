"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaintextHandlebarsNotificationTemplate = void 0;
const handlebars_1 = __importDefault(require("handlebars"));
class PlaintextHandlebarsNotificationTemplate {
    constructor(key, subject, body, fetchVariables) {
        this.fetchVariables = fetchVariables;
        this.key = key;
        // Parse and cache the template
        // Warning: noEscape is used here to avoid escaping special characters. The email *should*
        // be sent as plaintext though.
        this.body = handlebars_1.default.compile(body, { strict: true, noEscape: true });
        this.subject = handlebars_1.default.compile(subject, { strict: true });
    }
    render(variables) {
        return {
            subject: this.subject(variables),
            body: this.body(variables),
        };
    }
}
exports.PlaintextHandlebarsNotificationTemplate = PlaintextHandlebarsNotificationTemplate;
//# sourceMappingURL=NotificationTemplate.js.map