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
exports.lookupReviewers = exports.lookupReviewer = exports.setReviewerProvider = exports.reviewerProvider = void 0;
const logger_1 = require("../../logger");
class DefaultReviewerProvider {
    constructor() {
        this.key = "default";
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    lookup(ctx, _userIds) {
        throw new Error("Method not implemented.");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getReviewersForModel(ctx, _model) {
        throw new Error("Method not implemented.");
    }
    getFallbackReviewer(ctx) {
        throw new Error("Method not implemented.");
    }
    getReviewers(ctx) {
        throw new Error("Method not implemented.");
    }
}
const log = (0, logger_1.getLogger)("reviewerLookup");
exports.reviewerProvider = new DefaultReviewerProvider();
function setReviewerProvider(newReviewerProvider) {
    exports.reviewerProvider = newReviewerProvider;
}
exports.setReviewerProvider = setReviewerProvider;
function lookupReviewer(ctx, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield lookupReviewers(ctx, userId);
            if (!result || result.length === 0) {
                return null;
            }
            return result[0];
        }
        catch (err) {
            log.warn(`Errored while trying to look up reviewer: ${userId}`, err);
            return null;
        }
    });
}
exports.lookupReviewer = lookupReviewer;
function lookupReviewers(ctx, ...userIds) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            return yield exports.reviewerProvider.lookup(ctx, userIds);
        }
        catch (err) {
            log.warn(`Errored while trying to look up reviewers: ${userIds}`, err);
            return null;
        }
    });
}
exports.lookupReviewers = lookupReviewers;
//# sourceMappingURL=ReviewerProvider.js.map