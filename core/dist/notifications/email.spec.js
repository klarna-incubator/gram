"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jest_each_1 = __importDefault(require("jest-each"));
const email_1 = require("./email");
describe("email", () => {
    describe("sanitizeRecipientName", () => {
        (0, jest_each_1.default)(["Jön Jånsson", "jürgen straße"]).it("should allow '%j'", (name) => {
            expect((0, email_1.sanitizeRecipientName)(name)).toEqual(name);
        });
        (0, jest_each_1.default)([
            ["adminadminadmin ", "admin.admin@admin ("],
            ["Evil Team", "Evil: Team"],
            ["Admin adminadminadmin", "Admin <admin@admin.admin>"],
        ]).test("should replace illegal characters '%j'", (expected, ...args) => {
            expect((0, email_1.sanitizeRecipientName)(args[0])).toEqual(expected);
        });
    });
});
//# sourceMappingURL=email.spec.js.map