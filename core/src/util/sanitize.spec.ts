import { sanitizeEmail } from "./sanitize.js";

describe("sanitizeEmail", () => {
  const valid = [
    "test@t23st.tld",
    "admin_t3est@aksnmd.com",
    "not-a-real-email@not-k-larna.com",
  ];

  valid.map((email) =>
    it(`should allow valid email '${email}'`, () => {
      expect(sanitizeEmail(email)).toEqual(email);
    })
  );

  [
    ["test@t23st.tld", "test{;@t23st.tld"],
    ["", "\n\r"],
    ["", "!\"/=(#&='!(/#&"],
    ["aspacehere@hello", "a space here @ hello"],
    ["userpassword@hello", "user:password@hello"],
  ].map((sane) =>
    it(`should replace illegal characters '${sane[1]}'`, () => {
      expect(sanitizeEmail(sane[1])).toEqual(sane[0]);
    })
  );
});
