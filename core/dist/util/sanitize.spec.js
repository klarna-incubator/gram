"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jest_each_1 = __importDefault(require("jest-each"));
const sanitize_1 = require("./sanitize");
describe("sanitizeEmail", () => {
    const valid = [
        "test@t23st.tld",
        "admin_t3est@aksnmd.com",
        "not-a-real-email@not-k-larna.com",
    ];
    (0, jest_each_1.default)(valid).it("should allow valid email '%j'", (email) => {
        expect((0, sanitize_1.sanitizeEmail)(email)).toEqual(email);
    });
    (0, jest_each_1.default)([
        ["test@t23st.tld", "test{;@t23st.tld"],
        ["", "\n\r"],
        ["", "!\"/=(#&='!(/#&"],
        ["aspacehere@hello", "a space here @ hello"],
        ["userpassword@hello", "user:password@hello"],
    ]).test("should replace illegal characters '%j'", (expected, ...args) => {
        expect((0, sanitize_1.sanitizeEmail)(args[0])).toEqual(expected);
    });
});
//# sourceMappingURL=sanitize.spec.js.map