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
exports.send = exports.sanitizeRecipientName = void 0;
const emailjs_1 = require("emailjs");
const logger_1 = require("../logger");
const config_1 = __importDefault(require("config"));
const sanitize_1 = require("../util/sanitize");
const log = (0, logger_1.getLogger)("email");
const senderName = config_1.default.has("notifications.providers.email.sender-name")
    ? config_1.default.get("notifications.providers.email.sender-name")
    : "Gram";
// Allow overriding recipient email for debug purposes.
const overrideMail = config_1.default.has("notifications.providers.email.override-recipient")
    ? config_1.default.get("notifications.providers.email.override-recipient")
    : false;
/**
 * Sanitizes recipient names by removing special email characters.
 *
 * Unicode names are... complicated. So we do a blocklist approach here
 * Reference: https://datatracker.ietf.org/doc/html/rfc2822#section-3
 *
 * @param rawRecipient
 * @returns recipient name with special characters removed
 */
function sanitizeRecipientName(rawRecipient) {
    if (!rawRecipient)
        return "";
    return rawRecipient.replace(/[:()<>[\];@\\,."\n\r\t]/gu, "");
}
exports.sanitizeRecipientName = sanitizeRecipientName;
function send(client, templateHandler, notification) {
    return __awaiter(this, void 0, void 0, function* () {
        const content = templateHandler.render(notification.templateKey, notification.variables);
        const msg = new emailjs_1.Message({
            text: content.body,
            from: `${sanitizeRecipientName(senderName)} <${client.smtp.user()}>`,
            to: notification.variables.recipients.map((r) => `${sanitizeRecipientName(r.name)} <${(0, sanitize_1.sanitizeEmail)(overrideMail || r.email)}>`),
            cc: notification.variables.cc.map((cc) => `${sanitizeRecipientName(cc.name)} <${(0, sanitize_1.sanitizeEmail)(overrideMail || cc.email)}>`),
            subject: content.subject,
            content: "text/plain; charset=utf-8", // Warning: If you change this be aware that the template render function does not escape HTML!
        });
        log.debug(`Sending mail: ${JSON.stringify(msg, null, 2)}`);
        return !!(yield client.sendAsync(msg));
    });
}
exports.send = send;
//# sourceMappingURL=email.js.map