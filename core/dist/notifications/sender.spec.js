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
const utils_1 = require("ts-jest/utils");
const dal_1 = require("../data/dal");
const NotificationDataService_1 = require("../data/notifications/NotificationDataService");
const postgres_1 = require("../data/postgres");
const email_1 = require("./email");
const NotificationTemplate_1 = require("./NotificationTemplate");
const sender_1 = require("./sender");
jest.mock("./email");
const mockedSend = (0, utils_1.mocked)(email_1.send, true);
describe("notification sender", () => {
    let notificationService;
    let templateHandler;
    let pool;
    let dal;
    const sampleNotification = {
        templateKey: "review-approved",
        params: {},
    };
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        pool = yield (0, postgres_1.createPostgresPool)();
        dal = new dal_1.DataAccessLayer(pool);
        dal.templateHandler.register(new NotificationTemplate_1.PlaintextHandlebarsNotificationTemplate("review-approved", "Subject {name}", "Body {name}", () => __awaiter(void 0, void 0, void 0, function* () {
            return ({
                cc: [{ email: "nopemail", name: "nopename" }],
                recipients: [{ email: "nopemail", name: "nopename" }],
                name: "hello",
            });
        })));
        notificationService = new NotificationDataService_1.NotificationDataService(pool, dal);
    }));
    describe("notificationSender", () => {
        it("should mark notifications as sent", () => __awaiter(void 0, void 0, void 0, function* () {
            mockedSend.mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return true; }));
            const nid = yield notificationService.queue(sampleNotification);
            yield (0, sender_1.notificationSender)(notificationService, templateHandler);
            const notification = yield notificationService.getNotification(nid);
            expect(notification.status).toBe("sent");
        }));
        it("should mark notifications that returned false as failed", () => __awaiter(void 0, void 0, void 0, function* () {
            mockedSend.mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return false; }));
            const nid = yield notificationService.queue(sampleNotification);
            yield (0, sender_1.notificationSender)(notificationService, templateHandler);
            const notification = yield notificationService.getNotification(nid);
            expect(notification.status).toBe("failed");
        }));
        it("should mark notifications that errored as failed", () => __awaiter(void 0, void 0, void 0, function* () {
            mockedSend.mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () {
                throw new Error("kaboom");
            }));
            const nid = yield notificationService.queue(sampleNotification);
            yield (0, sender_1.notificationSender)(notificationService, templateHandler);
            const notification = yield notificationService.getNotification(nid);
            expect(notification.status).toBe("failed");
        }));
        it("should run ok with no notifications queued", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFn = mockedSend.mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return true; }));
            yield (0, sender_1.notificationSender)(notificationService, templateHandler);
            expect(mockFn.mock.calls.length).toBe(0);
        }));
        it("should only send once", () => __awaiter(void 0, void 0, void 0, function* () {
            const mockFn = mockedSend.mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return true; }));
            yield notificationService.queue(sampleNotification);
            yield (0, sender_1.notificationSender)(notificationService, templateHandler);
            yield (0, sender_1.notificationSender)(notificationService, templateHandler);
            yield (0, sender_1.notificationSender)(notificationService, templateHandler);
            expect(mockFn.mock.calls.length).toBe(1);
        }));
    });
    afterEach(() => {
        notificationService._truncate();
        mockedSend.mockReset();
    });
    afterAll(() => {
        mockedSend.mockRestore();
    });
});
//# sourceMappingURL=sender.spec.js.map