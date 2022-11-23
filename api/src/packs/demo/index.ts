import { App } from "octokit";
import { join } from "path";
import { Pack, PackRegistrator } from "..";
import secrets from "../../secrets";
import { GithubAuthProvider } from "./GithubAuthProvider";
import { GithubSystemProvider } from "./GithubSystemProvider";
import { GithubAuthzProvider } from "./GithubAuthzProvider";
import { StaticReviewerProvider } from "./StaticReviewerProvider";
import { GithubUserProvider } from "./GithubUserProvider";
import { EmailReviewApproved } from "./notifications/review-approved";
import { EmailReviewMeetingRequested } from "./notifications/review-meeting-requested";
import { EmailReviewMeetingRequestedReminder } from "./notifications/review-meeting-requested-reminder";
import { EmailReviewRequested } from "./notifications/review-requested";
import { EmailReviewerChanged } from "./notifications/reviewer-changed";
import { EmailReviewRequestedReminder } from "./notifications/review-requested-reminder";
import { additionalMigrations } from "./data";

export default class DemoPack implements Pack {
  async bootstrap(reg: PackRegistrator): Promise<void> {
    const appId = await secrets.get("auth.providerOpts.github.appId");
    const clientId = await secrets.get("auth.providerOpts.github.clientId");
    const clientSecret = await secrets.get(
      "auth.providerOpts.github.clientSecret"
    );
    const privateKey = await secrets.get("auth.providerOpts.github.privateKey");

    const app = new App({
      appId,
      privateKey,
      oauth: { clientId, clientSecret },
    });

    additionalMigrations(); //TODO rethink this..

    const userProvider = new GithubUserProvider(app);
    const systemProvider = new GithubSystemProvider(app);
    reg.setSystemProvider(systemProvider);
    reg.registerSystemPropertyProvider(systemProvider);
    reg.setAuthzProvider(new GithubAuthzProvider(app));
    reg.setReviewerProvider(new StaticReviewerProvider());
    reg.setUserProvider(userProvider);
    reg.registerAuthProvider(new GithubAuthProvider(app, userProvider));
    reg.registerAssets("github", join(__dirname, "assets"));

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
