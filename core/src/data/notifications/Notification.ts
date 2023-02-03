import { NotificationVariables } from "../../notifications/NotificationTemplate";
import { NotificationTemplateKey } from "./NotificationInput";

export type NotificationStatus = "new" | "pending" | "sent" | "failed";

export class Notification {
  id?: number;
  type: "email";
  status: NotificationStatus;
  sentAt?: number;
  createdAt?: number;
  updatedAt?: number;

  constructor(
    public templateKey: NotificationTemplateKey,
    public variables: NotificationVariables
  ) {
    this.type = "email";
    this.status = "new";
  }
}
