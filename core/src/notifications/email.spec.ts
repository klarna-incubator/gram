import { sanitizeRecipientName } from "./email.js";

describe("email", () => {
  describe("sanitizeRecipientName", () => {
    ["Jön Jånsson", "jürgen straße"].map((name) =>
      it(`should allow ${name}`, () => {
        expect(sanitizeRecipientName(name)).toEqual(name);
      })
    );

    [
      ["adminadminadmin ", "admin.admin@admin ("],
      ["Evil Team", "Evil: Team"],
      ["Admin adminadminadmin", "Admin <admin@admin.admin>"],
    ].map((sane) =>
      it(`should replace illegal characters '${sane[1]}'`, () => {
        expect(sanitizeRecipientName(sane[1])).toEqual(sane[0]);
      })
    );
  });
});
