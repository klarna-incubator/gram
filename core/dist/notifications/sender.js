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
exports.notificationSender = void 0;
const emailjs_1 = require("emailjs");
const logger_1 = require("../logger");
const secrets_1 = __importDefault(require("../secrets"));
const email_1 = require("./email");
const log = (0, logger_1.getLogger)("NotificationSender");
function notificationSender(notificationService, templateHandler) {
    return __awaiter(this, void 0, void 0, function* () {
        const notifications = yield notificationService.pollNewNotifications();
        if (notifications.length === 0) {
            log.debug("No new notifications to send");
            return;
        }
        const host = yield secrets_1.default.get("notifications.providers.email.host");
        const port = parseInt(yield secrets_1.default.getOrDefault("notifications.providers.email.port", "25"));
        const user = yield secrets_1.default.get("notifications.providers.email.user");
        const password = yield secrets_1.default.getOrDefault("notifications.providers.email.password", undefined);
        const client = new emailjs_1.SMTPClient({
            user,
            password,
            host,
            port,
            tls: true, // NOT OPTIONAL 🙅
        });
        const result = yield Promise.all(notifications.map((notification) => __awaiter(this, void 0, void 0, function* () {
            const result = { id: notification.id, success: false };
            try {
                result.success = yield (0, email_1.send)(client, templateHandler, notification);
            }
            catch (err) {
                log.error(`Failed to send notification ${notification.id}: ${err}\n${err.stack}`);
                result.success = false;
            }
            return result;
        })));
        // Mark successful mails as sent.
        const successfulMails = result
            .filter((n) => n.success)
            .map((n) => n.id);
        if (successfulMails.length > 0) {
            log.info(`Sent notifications [${successfulMails.join(",")}]`);
            yield notificationService.updateStatus(successfulMails, "sent");
        }
        // Mark failed emails
        const failedEmails = result
            .filter((n) => !n.success)
            .map((n) => n.id);
        if (failedEmails.length > 0) {
            log.warn(`Failed to send notifications [${failedEmails.join(",")}]`);
            yield notificationService.updateStatus(failedEmails, "failed");
        }
    });
}
exports.notificationSender = notificationSender;
//# sourceMappingURL=sender.js.map