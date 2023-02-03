import { NotificationTemplateKey } from "../data/notifications/NotificationInput";
import { NotificationTemplate, NotificationVariables } from "./NotificationTemplate";
export declare class TemplateHandler {
    private templates;
    register(template: NotificationTemplate): void;
    render(key: NotificationTemplateKey, variables: NotificationVariables): {
        subject: string;
        body: string;
    };
    get(key: NotificationTemplateKey): NotificationTemplate | undefined;
}
//# sourceMappingURL=TemplateHandler.d.ts.map