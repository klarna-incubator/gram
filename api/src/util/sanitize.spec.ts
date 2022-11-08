import each from "jest-each";
import { sanitizeEmail } from "./sanitize";

describe("sanitizeEmail", () => {
  const valid = [
    "test@t23st.tld",
    "admin_t3est@aksnmd.com",
    "not-a-real-email@not-k-larna.com",
  ];

  each(valid).it("should allow valid email '%j'", (email) => {
    expect(sanitizeEmail(email)).toEqual(email);
  });

  each([
    ["test@t23st.tld", "test{;@t23st.tld"],
    ["", "\n\r"],
    ["", "!\"/=(#&='!(/#&"],
    ["aspacehere@hello", "a space here @ hello"],
    ["userpassword@hello", "user:password@hello"],
  ]).test("should replace illegal characters '%j'", (expected, ...args) => {
    expect(sanitizeEmail(args[0])).toEqual(expected);
  });
});
