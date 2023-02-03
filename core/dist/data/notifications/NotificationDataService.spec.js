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
const NotificationTemplate_1 = require("../../notifications/NotificationTemplate");
const dal_1 = require("../dal");
const postgres_1 = require("../postgres");
const utils_1 = require("../utils");
const NotificationDataService_1 = require("./NotificationDataService");
const sampleNotification = new NotificationTemplate_1.PlaintextHandlebarsNotificationTemplate("review-approved", "Subject {param}", "Body {param}", (dal, { param }) => __awaiter(void 0, void 0, void 0, function* () {
    return {
        cc: [
            {
                name: "nopename",
                email: "nopemail",
            },
        ],
        recipients: [
            {
                name: "nopename",
                email: "nopemail",
            },
        ],
        param,
    };
}));
describe("NotificationDataService implementation", () => {
    let pool;
    let dal;
    let data;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        pool = yield (0, postgres_1.createPostgresPool)();
        dal = new dal_1.DataAccessLayer(pool);
        dal.templateHandler.register(sampleNotification);
        data = new NotificationDataService_1.NotificationDataService(pool, dal);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, utils_1._deleteAllTheThings)(pool);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield pool.end();
    }));
    describe("queue", () => {
        it("should create a new notification", () => __awaiter(void 0, void 0, void 0, function* () {
            const nid = yield data.queue({
                templateKey: "review-approved",
                params: { param: "hello" },
            });
            const fetched = yield data.getNotification(nid);
            expect(fetched.status).toBe("new");
            expect(fetched.templateKey).toBe("review-approved");
            expect(fetched.variables.param).toBe("hello");
        }));
    });
    describe("pollNewNotifications", () => {
        it("should update status to pending", () => __awaiter(void 0, void 0, void 0, function* () {
            const nid = yield data.queue({
                templateKey: "review-approved",
                params: { param: "hello" },
            });
            const notifications = yield data.pollNewNotifications();
            expect(notifications[0].id).toBe(nid);
            const fetched = yield data.getNotification(nid);
            expect(fetched.status).toBe("pending");
        }));
    });
    describe("updateStatus", () => {
        it("should update status", () => __awaiter(void 0, void 0, void 0, function* () {
            const nid = yield data.queue({
                templateKey: "review-approved",
                params: { param: "hello" },
            });
            const result = yield data.updateStatus([nid], "sent");
            expect(result).toBe(true);
            const fetched = yield data.getNotification(nid);
            expect(fetched.status).toBe("sent");
            expect(fetched.templateKey).toBe("review-approved");
            expect(fetched.variables.param).toBe("hello");
        }));
    });
    describe("countFailures", () => {
        it("should return if there are failed notifications", () => __awaiter(void 0, void 0, void 0, function* () {
            const nid = yield data.queue({
                templateKey: "review-approved",
                params: { param: "hello" },
            });
            yield data.updateStatus([nid], "failed");
            expect(yield data.countFailures()).toBe(1);
        }));
        it("should return 0 if no failed notifications", () => __awaiter(void 0, void 0, void 0, function* () {
            expect(yield data.countFailures()).toBe(0);
        }));
    });
    describe("countStalled", () => {
        it("should return if there are pending notifications", () => __awaiter(void 0, void 0, void 0, function* () {
            const nid = yield data.queue({
                templateKey: "review-approved",
                params: { param: "hello" },
            });
            yield data.updateStatus([nid], "pending");
            expect(yield data.countStalled()).toBe(1);
        }));
        it("should return 0 if no pending notifications", () => __awaiter(void 0, void 0, void 0, function* () {
            expect(yield data.countStalled()).toBe(0);
        }));
    });
});
//# sourceMappingURL=NotificationDataService.spec.js.map