import { SMTPClient } from "emailjs";
import { Notification } from "../data/notifications/Notification";
import { TemplateHandler } from "./TemplateHandler";
/**
 * Sanitizes recipient names by removing special email characters.
 *
 * Unicode names are... complicated. So we do a blocklist approach here
 * Reference: https://datatracker.ietf.org/doc/html/rfc2822#section-3
 *
 * @param rawRecipient
 * @returns recipient name with special characters removed
 */
export declare function sanitizeRecipientName(rawRecipient?: string): string;
export declare function send(client: SMTPClient, templateHandler: TemplateHandler, notification: Notification): Promise<boolean>;
//# sourceMappingURL=email.d.ts.map