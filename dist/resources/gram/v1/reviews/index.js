"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const get_1 = __importDefault(require("./get"));
const list_1 = __importDefault(require("./list"));
const create_1 = __importDefault(require("./create"));
const patch_1 = __importDefault(require("./patch"));
const cancel_1 = __importDefault(require("./cancel"));
const decline_1 = __importDefault(require("./decline"));
const approve_1 = __importDefault(require("./approve"));
const requestMeeting_1 = __importDefault(require("./requestMeeting"));
const reviewers_1 = __importDefault(require("./reviewers"));
const changeReviewer_1 = __importDefault(require("./changeReviewer"));
exports.default = (dal) => ({
    get: (0, get_1.default)(dal),
    list: (0, list_1.default)(dal),
    create: (0, create_1.default)(dal),
    patch: (0, patch_1.default)(dal),
    cancel: (0, cancel_1.default)(dal),
    decline: (0, decline_1.default)(dal),
    approve: (0, approve_1.default)(dal),
    requestMeeting: (0, requestMeeting_1.default)(dal),
    reviewers: (0, reviewers_1.default)(dal),
    changeReviewer: (0, changeReviewer_1.default)(dal),
});
//# sourceMappingURL=index.js.map