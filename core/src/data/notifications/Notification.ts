import {
  NotificationTemplateKey,
  NotificationVariables,
} from "./NotificationInput.js";

export type NotificationStatus =
  | "new"
  | "pending"
  | "sent"
  | "failed"
  | "dropped";

export class Notification {
  id?: number;
  /**
   * The key of the NotificationProvider this row is destined for (see
   * NotificationProvider.key). One row is created per registered provider at
   * queue time - this is not a hardcoded channel literal anymore.
   */
  type: string;
  status: NotificationStatus;
  sentAt?: number;
  createdAt?: number;
  updatedAt?: number;

  constructor(
    public templateKey: NotificationTemplateKey,
    public variables: NotificationVariables,
    type: string
  ) {
    this.type = type;
    this.status = "new";
  }
}
