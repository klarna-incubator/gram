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
exports.SampleEmailRequested = exports.SampleEmailMeetingRequested = exports.SampleEmailReviewApproved = void 0;
const NotificationTemplate_1 = require("@gram/core/dist/notifications/NotificationTemplate");
const key = "review-approved";
const subject = `{{model.name}} threat model approved!`;
const template = `
{{review}}
`.trim();
exports.SampleEmailReviewApproved = new NotificationTemplate_1.PlaintextHandlebarsNotificationTemplate("review-approved", subject, template, (dal, variables) => __awaiter(void 0, void 0, void 0, function* () {
    return Object.assign({ cc: [], recipients: [variables.review.requestedBy, variables.review.reviewer] }, variables);
}));
exports.SampleEmailMeetingRequested = new NotificationTemplate_1.PlaintextHandlebarsNotificationTemplate("review-meeting-requested", subject, template, (dal, variables) => __awaiter(void 0, void 0, void 0, function* () {
    return Object.assign({ cc: [], recipients: [variables.review.requestedBy, variables.review.reviewer] }, variables);
}));
exports.SampleEmailRequested = new NotificationTemplate_1.PlaintextHandlebarsNotificationTemplate("review-requested", subject, template, (dal, variables) => __awaiter(void 0, void 0, void 0, function* () {
    return Object.assign({ cc: [], recipients: [variables.review.requestedBy, variables.review.reviewer] }, variables);
}));
//# sourceMappingURL=sampleNotifications.js.map