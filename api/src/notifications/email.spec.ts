import each from "jest-each";
import { sanitizeRecipientName } from "./email";

describe("email", () => {
  describe("sanitizeRecipientName", () => {
    each(["Jön Jånsson", "jürgen straße"]).it("should allow '%j'", (name) => {
      expect(sanitizeRecipientName(name)).toEqual(name);
    });

    each([
      ["adminadminadmin ", "admin.admin@admin ("],
      ["Evil Team", "Evil: Team"],
      ["Admin adminadminadmin", "Admin <admin@admin.admin>"],
    ]).test("should replace illegal characters '%j'", (expected, ...args) => {
      expect(sanitizeRecipientName(args[0])).toEqual(expected);
    });
  });
});
