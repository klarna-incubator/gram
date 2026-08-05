export type NotificationVariables = {
  [key: string]: any;
};

export type NotificationTemplateKey = string;

export type NotificationInput = {
  templateKey: NotificationTemplateKey;
  /**
   * The fully-resolved, channel-agnostic domain data for this event. Callers
   * (e.g. ReviewDataService, KlarnaCronJob) resolve this themselves before
   * queuing - there's no per-key template registry that does it on their
   * behalf, since that resolution isn't actually deployment-configurable.
   */
  variables: NotificationVariables;
};
