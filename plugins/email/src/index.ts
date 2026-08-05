export {
  EmailNotificationProvider,
  defineEmailTemplate,
} from "./EmailNotificationProvider.js";
export type {
  EmailRecipient,
  EmailSendableTemplate,
  EmailTemplateVariables,
  EmailTemplateRenderer,
  EmailProviderTemplates,
  EmailNotificationProviderSettings,
} from "./EmailNotificationProvider.js";
export type { NotificationConfiguration } from "@gram/core/dist/config/GramConfiguration.js";
export { sanitizeRecipientName } from "./sanitize.js";
export { emailProviderTemplates } from "./templates/index.js";
