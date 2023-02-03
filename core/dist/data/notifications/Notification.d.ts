import { NotificationVariables } from "../../notifications/NotificationTemplate";
import { NotificationTemplateKey } from "./NotificationInput";
export type NotificationStatus = "new" | "pending" | "sent" | "failed";
export declare class Notification {
    templateKey: NotificationTemplateKey;
    variables: NotificationVariables;
    id?: number;
    type: "email";
    status: NotificationStatus;
    sentAt?: number;
    createdAt?: number;
    updatedAt?: number;
    constructor(templateKey: NotificationTemplateKey, variables: NotificationVariables);
}
//# sourceMappingURL=Notification.d.ts.map