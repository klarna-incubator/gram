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
  /**
   * Opaque id returned by the provider at dispatch time. Null until a dispatch that still needs confirmation returns
   * one. One-shot sends (eg. email) leave this unset.
   */
  providerRef?: string;
  /**
   * How many confirmation polls have come back still in flight. Dispatch
   * retries do not increment this.
   */
  confirmationAttempts = 0;
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
