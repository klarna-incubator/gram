import { Review } from "../reviews/Review.js";

type NotificationInputVariables = {
  review?: Review;
  [k: string]: unknown;
};

export type NotificationTemplateKey =
  | "review-approved"
  | "review-requested"
  | "review-requested-reminder"
  | "review-meeting-requested"
  | "review-meeting-requested-reminder"
  | "review-reviewer-changed"
  | "review-canceled"
  | "review-declined"
  | string;

export type NotificationInput = {
  templateKey: NotificationTemplateKey;
  params: NotificationInputVariables;
};
