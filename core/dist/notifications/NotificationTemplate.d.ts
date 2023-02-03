import { DataAccessLayer } from "../data/dal";
import { NotificationTemplateKey } from "../data/notifications/NotificationInput";
export type NotificationVariables = {
    recipients: EmailRecipient[];
    cc: EmailRecipient[];
    [key: string]: any;
};
type DataFetcher = (dal: DataAccessLayer, parameters: any) => Promise<NotificationVariables>;
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
export declare class PlaintextHandlebarsNotificationTemplate implements NotificationTemplate {
    fetchVariables: DataFetcher;
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
    constructor(key: NotificationTemplateKey, subject: string, body: string, fetchVariables: DataFetcher);
    render(variables: NotificationVariables): {
        subject: string;
        body: string;
    };
}
export {};
//# sourceMappingURL=NotificationTemplate.d.ts.map