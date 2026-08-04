import Handlebars from "handlebars";
import { Message, SMTPClient } from "emailjs";
import log4js from "log4js";
import { Secret } from "@gram/core/dist/config/Secret.js";
import { sanitizeEmail } from "@gram/core/dist/util/sanitize.js";
import {
  NotificationTemplateKey,
  NotificationVariables,
} from "@gram/core/dist/data/notifications/NotificationInput.js";
import { NotificationConfiguration } from "@gram/core/dist/config/GramConfiguration.js";
import {
  DropMarker,
  isDropMarker,
  NotificationProvider,
  ProviderTemplate,
  SendableTemplate,
} from "@gram/core/dist/notifications/NotificationProvider.js";
import { sanitizeRecipientName } from "./sanitize.js";

const log = log4js.getLogger("EmailNotificationProvider");

export type EmailRecipient = {
  email?: string;
  name?: string;
};

/**
 * The real, sendable template shape this provider produces. Not shared with any
 * other channel - each provider defines its own.
 */
export type EmailSendableTemplate = SendableTemplate & {
  subject: string;
  body: string;
  recipients: EmailRecipient[];
  cc: EmailRecipient[];
};

/**
 * The channel-agnostic domain-data bag (from core's fetchVariables) plus the
 * email-specific recipients/cc shape and any Handlebars-conditional flags a
 * specific template needs. This is what a template's `buildVariables` callback
 * returns - it's local to this provider, never seen by core.
 */
export type EmailTemplateVariables = NotificationVariables & {
  recipients: EmailRecipient[];
  cc: EmailRecipient[];
};

export type EmailTemplateRenderer = (
  variables: NotificationVariables,
  notificationConfig: NotificationConfiguration
) => EmailSendableTemplate | DropMarker;

/**
 * Lookup table of this provider's email templates, keyed by notification
 * template key - built-in review-lifecycle events, plugin-registered keys like
 * magic-link's login template, or anything else a caller queues. A key with no
 * entry here resolves to `failed` when a notification for it is routed to this
 * provider - never a silent no-op.
 */
export type EmailProviderTemplates = Record<string, EmailTemplateRenderer>;

/**
 * Compiles a Handlebars subject/body pair once, and returns a renderer that,
 * given the shared channel-agnostic domain-data bag, computes the email-specific
 * recipients/cc (and any other presentational flags the template needs) via
 * `buildVariables`, then renders subject/body against the combined result.
 *
 * `buildVariables` may return a DropMarker instead, to deliberately opt this
 * template out of being sent on the email channel.
 */
export function defineEmailTemplate(
  subject: string,
  body: string,
  buildVariables: (
    base: NotificationVariables,
    notificationConfig: NotificationConfiguration
  ) => EmailTemplateVariables | DropMarker
): EmailTemplateRenderer {
  const compiledSubject = Handlebars.compile(subject, { strict: true });
  // Warning: noEscape is used here to avoid escaping special characters. The email
  // *should* be sent as plaintext though.
  const compiledBody = Handlebars.compile(body, {
    strict: true,
    noEscape: true,
  });

  return (
    base: NotificationVariables,
    notificationConfig: NotificationConfiguration
  ) => {
    const emailVariables = buildVariables(base, notificationConfig);

    if (isDropMarker(emailVariables)) {
      return emailVariables;
    }

    return {
      subject: compiledSubject(emailVariables),
      body: compiledBody(emailVariables),
      recipients: emailVariables.recipients,
      cc: emailVariables.cc,
    };
  };
}

/**
 * SMTP connection settings and transport-level behavior for
 * EmailNotificationProvider. Credentials are `Secret`s, resolved lazily on first
 * send - never read from core's global `config` singleton. The composition root
 * (config/default.ts or equivalent) is responsible for constructing these
 * (typically via `EnvSecret`/`ExposedSecret`) and passing them in here.
 */
export type EmailNotificationProviderSettings = {
  host: Secret;
  port: Secret;
  user: Secret;
  password: Secret;
  senderName?: string;
  // Allow overriding recipient email for debug purposes. This will make all
  // outgoing email (both `to` and `cc`) go to this address instead.
  overrideRecipient?: string;
  // Whether to use STARTTLS. Defaults to true.
  tls?: boolean;
  // Whether to connect over implicit TLS/SSL. Defaults to false.
  ssl?: boolean;
};

/**
 * The reference NotificationProvider implementation, delivering over SMTP.
 * `render()` looks up `templates` by whatever key it's given - there's no
 * closed set of keys this must cover; a key with no entry correctly reports
 * `failed` rather than a silent no-op.
 */
export class EmailNotificationProvider extends NotificationProvider {
  readonly key = "email";

  private client: SMTPClient | null = null;

  constructor(
    private settings: EmailNotificationProviderSettings,
    private templates: EmailProviderTemplates,
    private notificationConfig: NotificationConfiguration
  ) {
    super();
  }

  render(
    templateKey: NotificationTemplateKey,
    variables: NotificationVariables
  ): ProviderTemplate | undefined {
    return this.templates[templateKey]?.(variables, this.notificationConfig);
  }

  private async getClient(): Promise<SMTPClient> {
    if (this.client) {
      return this.client;
    }

    const host = await this.settings.host.getValue();
    const port = parseInt((await this.settings.port.getValue()) || "25");
    const user = await this.settings.user.getValue();
    const password = await this.settings.password.getValue();
    const tls = this.settings.tls ?? true;
    const ssl = this.settings.ssl ?? false;

    this.client = new SMTPClient({
      user,
      password,
      host,
      port,
      tls,
      ssl,
    });

    return this.client;
  }

  protected async send(template: EmailSendableTemplate): Promise<boolean> {
    const emailTemplate = template as EmailSendableTemplate;
    const client = await this.getClient();

    const senderName = this.settings.senderName || "Gram";

    // Allow overriding recipient email for debug purposes.
    const overrideMail = this.settings.overrideRecipient || false;

    const msg: Message = new Message({
      text: emailTemplate.body,
      from: `${sanitizeRecipientName(senderName)} <${client.smtp.user()}>`,
      to: emailTemplate.recipients.map(
        (r) =>
          `${sanitizeRecipientName(r.name)} <${sanitizeEmail(
            overrideMail || r.email
          )}>`
      ),
      cc: emailTemplate.cc.map(
        (cc) =>
          `${sanitizeRecipientName(cc.name)} <${sanitizeEmail(
            overrideMail || cc.email
          )}>`
      ),
      subject: emailTemplate.subject,
      content: "text/plain; charset=utf-8", // Warning: if you change this, the template render above does not escape HTML!
    });

    log.debug(`Sending mail: ${JSON.stringify(msg, null, 2)}`);

    return !!(await client.sendAsync(msg));
  }
}
