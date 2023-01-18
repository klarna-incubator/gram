import { Plugin, PluginRegistrator } from "gram-api/src/plugin";
import { EmailReviewApproved } from "./notifications/review-approved";
import { EmailReviewMeetingRequested } from "./notifications/review-meeting-requested";
import { EmailReviewMeetingRequestedReminder } from "./notifications/review-meeting-requested-reminder";
import { EmailReviewRequested } from "./notifications/review-requested";
import { EmailReviewRequestedReminder } from "./notifications/review-requested-reminder";
import { EmailReviewerChanged } from "./notifications/reviewer-changed";
import { StaticReviewerProvider } from "./StaticReviewerProvider";

export default class StaticPlugin implements Plugin {
  async bootstrap(reg: PluginRegistrator): Promise<void> {
    reg.setReviewerProvider(new StaticReviewerProvider());

    reg.registerNotificationTemplates([
      EmailReviewApproved(),
      EmailReviewMeetingRequested(),
      EmailReviewMeetingRequestedReminder(),
      EmailReviewRequested(),
      EmailReviewerChanged(),
      EmailReviewRequestedReminder(),
    ]);
  }
}
