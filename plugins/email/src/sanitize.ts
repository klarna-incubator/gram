/**
 * Sanitizes recipient names by removing special email characters.
 *
 * Unicode names are... complicated. So we do a blocklist approach here
 * Reference: https://datatracker.ietf.org/doc/html/rfc2822#section-3
 *
 * @param rawRecipient
 * @returns recipient name with special characters removed
 */
export function sanitizeRecipientName(rawRecipient?: string) {
  if (!rawRecipient) return "";
  return rawRecipient.replace(/[:()<>[\];@\\,."\n\r\t]/gu, "");
}
