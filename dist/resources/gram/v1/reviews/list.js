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
const lodash_1 = require("lodash");
const user_1 = require("@gram/core/dist/auth/user");
const ReviewDataService_1 = require("@gram/core/dist/data/reviews/ReviewDataService");
const logger_1 = require("@gram/core/dist/logger");
const log = (0, logger_1.getLogger)("list.reviews");
exports.default = (dal) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filters = {
        statuses: req.query["statuses"]
            ? req.query["statuses"]
                .toString()
                .split(",")
                .filter(ReviewDataService_1.validStatus)
                .map((s) => s)
            : [],
        properties: req.query["properties"]
            ? req.query["properties"]
                .toString()
                .split(",")
                .map((filter) => filter.split(":"))
                .filter((parts) => parts.length === 2)
                .map((parts) => {
                const filter = {
                    propertyId: parts[0],
                    value: parts[1],
                };
                return filter;
            })
            : [],
        requestedBy: req.query["requestedBy"]
            ? req.query["requestedBy"].toString()
            : undefined,
        reviewedBy: req.query["reviewedBy"]
            ? req.query["reviewedBy"].toString()
            : undefined,
    };
    const dateOrder = req.query["date-order"] === "DESC" ? "DESC" : "ASC";
    const page = req.query["page"] ? parseInt(req.query["page"].toString()) : 0;
    const reviews = yield dal.reviewService.list({ currentRequest: req }, filters, page, dateOrder);
    const reslookupUsers = yield (0, user_1.lookupUsers)({ currentRequest: req }, reviews.items
        .filter((review) => review.requestedBy)
        .map((review) => review.requestedBy));
    const employees = reslookupUsers.map((employee) => ({
        requester: employee,
    }));
    const result = {
        total: reviews.total,
        items: (0, lodash_1.merge)(reviews.items, employees), // This might not merge correctly if the list of users !=
    };
    return res.json(result);
});
//# sourceMappingURL=list.js.map