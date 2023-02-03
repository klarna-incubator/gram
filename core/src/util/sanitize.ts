/**
 * Sanitize email by replacing any non-alphanumeric ascii characters + @ . - and _
 * Might not cover all cases, but hopefully good enough.
 * @param email
 * @returns
 */
export function sanitizeEmail(rawEmail?: string) {
  if (!rawEmail) return "";
  return rawEmail.replace(/[^A-Za-z0-9@.+\-_]+/g, "");
}
