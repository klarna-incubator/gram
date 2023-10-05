import Handlebars from "handlebars";
import { DataAccessLayer } from "../data/dal.js";
import { NotificationTemplateKey } from "../data/notifications/NotificationInput.js";

export type NotificationVariables = {
  recipients: EmailRecipient[];
  cc: EmailRecipient[];
  [key: string]: any;
};

type DataFetcher = (
  dal: DataAccessLayer,
  parameters: any
) => Promise<NotificationVariables>;

export type EmailRecipient = {
  email?: string;
  name?: string;
};

export interface NotificationTemplate {
  /**
   * A unique string to identify this template by. It will be registered to this key.
   */
  key: NotificationTemplateKey;

  /**
   * Method to render the email
   */
  render(variables: NotificationVariables): {
    subject: string;
    body: string;
  };

  /**
   *
   * @param dal
   */
  fetchVariables: DataFetcher;
}

export class PlaintextHandlebarsNotificationTemplate
  implements NotificationTemplate
{
  /**
   * A unique string to identify this template by. It will be registered to this key.
   */
  key: NotificationTemplateKey;

  /**
   * The body of the email. Should be a handlebars template
   */
  body: HandlebarsTemplateDelegate;

  /**
   * The subject of the email. Also a handlebars template.
   */
  subject: HandlebarsTemplateDelegate;

  constructor(
    key: NotificationTemplateKey,
    subject: string,
    body: string,
    public fetchVariables: DataFetcher
  ) {
    this.key = key;
    // Parse and cache the template
    // Warning: noEscape is used here to avoid escaping special characters. The email *should*
    // be sent as plaintext though.
    this.body = Handlebars.compile(body, { strict: true, noEscape: true });
    this.subject = Handlebars.compile(subject, { strict: true });
  }

  render(variables: NotificationVariables) {
    return {
      subject: this.subject(variables),
      body: this.body(variables),
    };
  }
}
