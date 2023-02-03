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
exports.testReviewerProvider = exports.sampleOtherReviewer = exports.sampleReviewer = void 0;
const sampleTeam_1 = require("./sampleTeam");
exports.sampleReviewer = {
    sub: "reviewer@abc.xyz",
    mail: "reviewer@abc.xyz",
    name: "Reviewer",
    teams: [sampleTeam_1.sampleOtherTeam],
    recommended: false,
};
exports.sampleOtherReviewer = {
    sub: "other-reviewer@abc.xyz",
    mail: "other-reviewer@abc.xyz",
    name: "Other Reviewer",
    teams: [sampleTeam_1.sampleTeam],
    recommended: false,
};
const reviewers = [exports.sampleReviewer, exports.sampleOtherReviewer];
class TestReviewerProvider {
    constructor() {
        this.key = "test";
    }
    lookup(ctx, userIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return userIds
                .map((uid) => reviewers.find((u) => u.sub === uid))
                .filter((u) => u);
        });
    }
    getReviewersForModel(ctx, model) {
        return __awaiter(this, void 0, void 0, function* () {
            return reviewers;
        });
    }
    getReviewers() {
        return __awaiter(this, void 0, void 0, function* () {
            return reviewers;
        });
    }
    getFallbackReviewer() {
        return __awaiter(this, void 0, void 0, function* () {
            return exports.sampleOtherReviewer;
        });
    }
}
exports.testReviewerProvider = new TestReviewerProvider();
//# sourceMappingURL=sampleReviewer.js.map