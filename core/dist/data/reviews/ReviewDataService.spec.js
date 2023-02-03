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
const crypto_1 = require("crypto");
const dal_1 = require("../dal");
const postgres_1 = require("../postgres");
const utils_1 = require("../utils");
const Review_1 = require("./Review");
const ReviewDataService_1 = require("./ReviewDataService");
const model_1 = require("../../test-util/model");
const ReviewerProvider_1 = require("./ReviewerProvider");
const sampleReviewer_1 = require("../../test-util/sampleReviewer");
describe("ReviewDataService implementation", () => {
    let pool;
    let dal;
    let data;
    let modelId;
    let notificationQueue;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        pool = yield (0, postgres_1.createPostgresPool)();
        dal = new dal_1.DataAccessLayer(pool);
        data = new ReviewDataService_1.ReviewDataService(pool, dal);
        notificationQueue = jest.spyOn(dal.notificationService, "queue");
        yield (0, utils_1._deleteAllTheThings)(pool);
        (0, ReviewerProvider_1.setReviewerProvider)(sampleReviewer_1.testReviewerProvider);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, utils_1._deleteAllTheThings)(pool);
        /** Set up test model needed for review **/
        modelId = yield (0, model_1.createSampleModel)(dal);
    }));
    afterEach(() => {
        notificationQueue.mockReset();
    });
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        notificationQueue.mockRestore();
        yield pool.end();
    }));
    describe("getByModelId", () => {
        it("should return a valid review", () => __awaiter(void 0, void 0, void 0, function* () {
            notificationQueue.mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return 123; }));
            const review = new Review_1.Review(modelId, "some-user", Review_1.ReviewStatus.Requested);
            review.note = "Good review";
            yield data.create(review);
            const fetched = yield data.getByModelId(modelId);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.toJSON()).toBeDefined();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.modelId).toBe(modelId);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.note).toEqual("Good review");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.status).toEqual(Review_1.ReviewStatus.Requested);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.reviewedBy).toEqual("");
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt.getTime()).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt.getTime()).toBeGreaterThan(yesterday.getTime());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt.getTime()).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt.getTime()).toBeGreaterThan(yesterday.getTime());
            expect(notificationQueue.mock.calls.length).toBe(1);
        }));
        it("should return null value by default", () => __awaiter(void 0, void 0, void 0, function* () {
            const review = yield data.getByModelId((0, crypto_1.randomUUID)());
            expect(review).toBe(null);
        }));
    });
    describe("getByModelId", () => {
        it("should return valid review associated to a model", () => __awaiter(void 0, void 0, void 0, function* () {
            const review = new Review_1.Review(modelId, "some-user", Review_1.ReviewStatus.Requested);
            review.note = "Good review";
            yield data.create(review);
            const fetched = yield data.getByModelId(modelId);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.toJSON()).toBeDefined();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.modelId).toBe(modelId);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.note).toEqual("Good review");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.status).toEqual(Review_1.ReviewStatus.Requested);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.reviewedBy).toEqual("");
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt.getTime()).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt.getTime()).toBeGreaterThan(yesterday.getTime());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt.getTime()).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt.getTime()).toBeGreaterThan(yesterday.getTime());
        }));
        it("should returns empty when no reviews exist for model", () => __awaiter(void 0, void 0, void 0, function* () {
            const review = yield data.getByModelId(modelId);
            expect(review).toEqual(null);
        }));
    });
    describe("list", () => {
        it("should return valid reviews by reviewer", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            const review = new Review_1.Review(yield (0, model_1.createSampleModel)(dal), "some-user", Review_1.ReviewStatus.Requested, "some-reviewer");
            review.note = "Good review";
            yield data.create(review);
            const review2 = new Review_1.Review(yield (0, model_1.createSampleModel)(dal), "some-user", Review_1.ReviewStatus.Requested, "some-reviewer");
            review2.note = "Another good review";
            yield data.create(review2);
            const review3 = new Review_1.Review(yield (0, model_1.createSampleModel)(dal), "some-user", Review_1.ReviewStatus.Requested, "another-reviewer");
            review3.note = "Another review";
            yield data.create(review3);
            const result = yield data.list({}, {
                reviewedBy: "some-reviewer",
            });
            expect(result.items.some((r) => r.modelId === review.modelId)).toBeTruthy();
            expect(result.items.some((r) => r.modelId === review2.modelId)).toBeTruthy();
            expect(result.items.some((r) => r.modelId === review3.modelId)).toBeFalsy();
            expect(result.items.length).toEqual(2);
            const fetched = result.items[0];
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.modelId).toBe(review.modelId);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.note).toEqual("Good review");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.status).toEqual(Review_1.ReviewStatus.Requested);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.reviewedBy).toEqual("some-reviewer");
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect((_a = fetched === null || fetched === void 0 ? void 0 : fetched.createdAt) === null || _a === void 0 ? void 0 : _a.getTime()).toBeLessThan(Date.now() + 1000);
            expect((_b = fetched === null || fetched === void 0 ? void 0 : fetched.createdAt) === null || _b === void 0 ? void 0 : _b.getTime()).toBeGreaterThan(yesterday.getTime());
            expect((_c = fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt) === null || _c === void 0 ? void 0 : _c.getTime()).toBeLessThan(Date.now() + 1000);
            expect((_d = fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt) === null || _d === void 0 ? void 0 : _d.getTime()).toBeGreaterThan(yesterday.getTime());
        }));
        it("should return valid reviews by requester", () => __awaiter(void 0, void 0, void 0, function* () {
            const review = new Review_1.Review(yield (0, model_1.createSampleModel)(dal), "some-user", Review_1.ReviewStatus.Requested, "some-reviewer");
            review.note = "Good review";
            yield data.create(review);
            const review2 = new Review_1.Review(yield (0, model_1.createSampleModel)(dal), "some-user", Review_1.ReviewStatus.Requested, "some-reviewer");
            review2.note = "Another good review";
            yield data.create(review2);
            const review3 = new Review_1.Review(yield (0, model_1.createSampleModel)(dal), "another-user", Review_1.ReviewStatus.Requested, "another-reviewer");
            review3.note = "Another review";
            yield data.create(review3);
            const result = yield data.list({}, {
                requestedBy: "some-user",
            });
            expect(result.items.some((r) => r.modelId === review.modelId)).toBeTruthy();
            expect(result.items.some((r) => r.modelId === review2.modelId)).toBeTruthy();
            expect(result.items.some((r) => r.modelId === review3.modelId)).toBeFalsy();
            expect(result.items.length).toEqual(2);
        }));
        it("should return valid reviews by statuses", () => __awaiter(void 0, void 0, void 0, function* () {
            const review = new Review_1.Review(yield (0, model_1.createSampleModel)(dal), "some-user", Review_1.ReviewStatus.Requested, "some-reviewer");
            review.note = "Good review";
            yield data.create(review);
            const review2 = new Review_1.Review(yield (0, model_1.createSampleModel)(dal), "some-user", Review_1.ReviewStatus.Declined, "some-reviewer");
            review2.note = "Another good review";
            yield data.create(review2);
            const review3 = new Review_1.Review(yield (0, model_1.createSampleModel)(dal), "some-user", Review_1.ReviewStatus.Approved, "another-reviewer");
            review3.note = "Another review";
            yield data.create(review3);
            const statuses = [Review_1.ReviewStatus.Requested, Review_1.ReviewStatus.Declined];
            const result = yield data.list({}, {
                statuses,
            });
            expect(result.items.some((r) => r.modelId === review.modelId)).toBeTruthy();
            expect(result.items.some((r) => r.modelId === review.modelId)).toBeTruthy();
            expect(result.items.length).toEqual(2);
        }));
        it("should combine multiple filters", () => __awaiter(void 0, void 0, void 0, function* () {
            const review = new Review_1.Review(yield (0, model_1.createSampleModel)(dal), "some-user", Review_1.ReviewStatus.Requested, "some-reviewer");
            review.note = "Good review";
            yield data.create(review);
            const review2 = new Review_1.Review(yield (0, model_1.createSampleModel)(dal), "some-user", Review_1.ReviewStatus.Declined, "some-reviewer");
            review2.note = "Another good review";
            yield data.create(review2);
            const review3 = new Review_1.Review(yield (0, model_1.createSampleModel)(dal), "another-user", Review_1.ReviewStatus.Approved, "another-reviewer");
            review3.note = "Another review";
            yield data.create(review3);
            const statuses = [Review_1.ReviewStatus.Approved, Review_1.ReviewStatus.Declined];
            const result = yield data.list({}, {
                statuses,
                reviewedBy: "another-reviewer",
                requestedBy: "another-user",
            });
            expect(result.items.some((r) => r.modelId === review3.modelId)).toBeTruthy();
            expect(result.items.length).toEqual(1);
        }));
        it("should support pagination", () => __awaiter(void 0, void 0, void 0, function* () {
            for (let i = 0; i < 11; i++) {
                const review = new Review_1.Review(yield (0, model_1.createSampleModel)(dal), "some-user", Review_1.ReviewStatus.Requested, "some-reviewer");
                review.note = "Good review";
                yield data.create(review);
            }
            let result = yield data.list({}, {});
            expect(result.items.length).toEqual(10); // Should not be hardcoded ideally == pagesize
            expect(result.total).toEqual(11);
            result = yield data.list({}, {}, 2);
            expect(result.items.length).toEqual(1);
            expect(result.total).toEqual(11);
        }));
        it("should returns empty when no reviews exist for model", () => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield data.list({}, { reviewedBy: "some-unknown-reviewer" });
            expect(result.total).toEqual(0);
            expect(result.items).toEqual([]);
        }));
    });
    describe("cancel", () => {
        it("should update status to Canceled", () => __awaiter(void 0, void 0, void 0, function* () {
            var _a;
            notificationQueue.mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return 123; }));
            const review = new Review_1.Review(modelId, "some-user", Review_1.ReviewStatus.Requested);
            review.requestedAt = new Date(2000, 1, 1);
            yield data.create(review);
            expect(notificationQueue.mock.calls.length).toBe(1);
            const res = yield data.cancel(modelId);
            // expect(notificationQueue.mock.calls.length).toBe(2);
            expect(res).toBeTruthy();
            const updatedReview = yield data.getByModelId(modelId);
            expect(updatedReview === null || updatedReview === void 0 ? void 0 : updatedReview.status).toEqual(Review_1.ReviewStatus.Canceled);
            expect((_a = updatedReview === null || updatedReview === void 0 ? void 0 : updatedReview.requestedAt) === null || _a === void 0 ? void 0 : _a.getFullYear()).toEqual(new Date(Date.now()).getFullYear());
        }));
        it("should return false on no matching review", () => __awaiter(void 0, void 0, void 0, function* () {
            const fakeId = (0, crypto_1.randomUUID)();
            const res = yield data.cancel(fakeId);
            expect(res).toBeFalsy();
        }));
    });
    describe("decline", () => {
        it("should update status to Declined", () => __awaiter(void 0, void 0, void 0, function* () {
            notificationQueue.mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return 123; }));
            const review = new Review_1.Review(modelId, "some-user", Review_1.ReviewStatus.Requested);
            yield data.create(review);
            expect(notificationQueue.mock.calls.length).toBe(1);
            const res = yield data.decline({}, review.modelId);
            // expect(notificationQueue.mock.calls.length).toBe(2);
            expect(res).toBeTruthy();
            const updatedReview = yield data.getByModelId(review.modelId);
            expect(updatedReview.status).toEqual(Review_1.ReviewStatus.Declined);
        }));
        it("should return false on no matching review", () => __awaiter(void 0, void 0, void 0, function* () {
            const fakeId = (0, crypto_1.randomUUID)();
            const res = yield data.decline({}, fakeId);
            expect(res).toBeFalsy();
        }));
    });
    describe("approve", () => {
        it("should update status to Approved", () => __awaiter(void 0, void 0, void 0, function* () {
            notificationQueue.mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return 123; }));
            const review = new Review_1.Review(modelId, "some-user", Review_1.ReviewStatus.Requested);
            yield data.create(review);
            expect(notificationQueue.mock.calls.length).toBe(1);
            const res = yield data.approve(review.modelId);
            expect(notificationQueue.mock.calls.length).toBe(2);
            expect(res).toBeTruthy();
            const updatedReview = yield data.getByModelId(review.modelId);
            expect(updatedReview.status).toEqual(Review_1.ReviewStatus.Approved);
        }));
        it("should return false on no matching review", () => __awaiter(void 0, void 0, void 0, function* () {
            const fakeId = (0, crypto_1.randomUUID)();
            const res = yield data.approve(fakeId);
            expect(res).toBeFalsy();
        }));
    });
    describe("requestMeeting", () => {
        it("should update status to meeting-requested", () => __awaiter(void 0, void 0, void 0, function* () {
            notificationQueue.mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return 123; }));
            const review = new Review_1.Review(modelId, "some-user", Review_1.ReviewStatus.Requested);
            yield data.create(review);
            expect(notificationQueue.mock.calls.length).toBe(1);
            const res = yield data.requestMeeting(review.modelId);
            expect(notificationQueue.mock.calls.length).toBe(2);
            expect(res).toBeTruthy();
            const updatedReview = yield data.getByModelId(review.modelId);
            expect(updatedReview.status).toEqual(Review_1.ReviewStatus.MeetingRequested);
        }));
        it("should return false on no matching review", () => __awaiter(void 0, void 0, void 0, function* () {
            const fakeId = (0, crypto_1.randomUUID)();
            const res = yield data.requestMeeting(fakeId);
            expect(res).toBeFalsy();
        }));
    });
    describe("changeReviewer", () => {
        it("should change reviewer", () => __awaiter(void 0, void 0, void 0, function* () {
            notificationQueue.mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return 123; }));
            const review = new Review_1.Review(modelId, "some-user", Review_1.ReviewStatus.Requested, "some-reviewer");
            yield data.create(review);
            expect(notificationQueue.mock.calls.length).toBe(1);
            const res = yield data.changeReviewer(review.modelId, "someone-else");
            expect(notificationQueue.mock.calls.length).toBe(2);
            expect(res).toBeTruthy();
            const updatedReview = yield data.getByModelId(review.modelId);
            expect(updatedReview.status).toEqual(Review_1.ReviewStatus.Requested);
            expect(updatedReview.reviewedBy).toEqual("someone-else");
        }));
        it("should not send notification if the same reviewer", () => __awaiter(void 0, void 0, void 0, function* () {
            notificationQueue.mockImplementation(() => __awaiter(void 0, void 0, void 0, function* () { return 123; }));
            const review = new Review_1.Review(modelId, "some-user", Review_1.ReviewStatus.Requested, "some-reviewer");
            yield data.create(review);
            expect(notificationQueue.mock.calls.length).toBe(1);
            const res = yield data.changeReviewer(review.modelId, "some-reviewer");
            expect(notificationQueue.mock.calls.length).toBe(1); // Note: same number of notifications sent
            expect(res).toBeTruthy();
            const updatedReview = yield data.getByModelId(review.modelId);
            expect(updatedReview.status).toEqual(Review_1.ReviewStatus.Requested);
            expect(updatedReview.reviewedBy).toEqual("some-reviewer");
        }));
        it("should return null on no matching review", () => __awaiter(void 0, void 0, void 0, function* () {
            const fakeId = (0, crypto_1.randomUUID)();
            const res = yield data.changeReviewer(fakeId, "whoever");
            expect(res).toBeFalsy();
        }));
    });
    describe("update", () => {
        it("should update note content", () => __awaiter(void 0, void 0, void 0, function* () {
            const review = new Review_1.Review(modelId, "some-user", Review_1.ReviewStatus.Requested);
            yield data.create(review);
            const res = yield data.update(review.modelId, {
                note: "Some good new note content",
            });
            expect(res).toBeTruthy();
            const newNote = yield data.getByModelId(review.modelId);
            expect(newNote.note).toEqual("Some good new note content");
        }));
        it("should be able to update existing review", () => __awaiter(void 0, void 0, void 0, function* () {
            const review = new Review_1.Review(modelId, "some-user", Review_1.ReviewStatus.Requested);
            yield data.create(review);
            const res = yield data.update(modelId, {
                reviewedBy: "awesome-reviewer",
            });
            expect(res).toBeTruthy();
            const updated = yield data.getByModelId(review.modelId);
            expect(updated.reviewedBy).toEqual("awesome-reviewer");
        }));
        it("should be able to update existing review", () => __awaiter(void 0, void 0, void 0, function* () {
            const review = new Review_1.Review(modelId, "some-user", Review_1.ReviewStatus.Requested);
            yield data.create(review);
            const res = yield data.update(review.modelId, {
                status: Review_1.ReviewStatus.Approved,
            });
            expect(res).toBeTruthy();
        }));
        it("should return false on no matching review", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield data.update(modelId, { status: Review_1.ReviewStatus.Approved });
            expect(res).toBeFalsy();
        }));
    });
});
//# sourceMappingURL=ReviewDataService.spec.js.map