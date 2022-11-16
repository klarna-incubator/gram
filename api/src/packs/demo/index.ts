import { App } from "octokit";
import { join } from "path";
import { Pack, PackRegistrator } from "..";
import secrets from "../../secrets";
import { GithubAuthProvider } from "./GithubAuthProvider";
import { GithubSystemProvider } from "./GithubSystemProvider";
import { GithubAuthzProvider } from "./GithubAuthzProvider";
import { StaticReviewerProvider } from "./StaticReviewerProvider";
import { GithubUserProvider } from "./GithubUserProvider";
import { createAppAuth } from "@octokit/auth-app";
import { EmailReviewApproved } from "./notifications/review-approved";
import { EmailReviewMeetingRequested } from "./notifications/review-meeting-requested";
import { EmailReviewMeetingRequestedReminder } from "./notifications/review-meeting-requested-reminder";
import { EmailReviewRequested } from "./notifications/review-requested";
import { EmailReviewerChanged } from "./notifications/reviewer-changed";
import { EmailReviewRequestedReminder } from "./notifications/review-requested-reminder";

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

    reg.registerAuthProvider(new GithubAuthProvider(app));
    reg.setSystemProvider(new GithubSystemProvider(app));
    reg.setAuthzProvider(new GithubAuthzProvider(app));
    reg.setReviewerProvider(new StaticReviewerProvider());
    reg.setUserProvider(new GithubUserProvider(app));
    reg.registerAssets("github", join(__dirname, "assets"));

    reg.registerNotificationTemplates([
      EmailReviewApproved(octane),
      EmailReviewMeetingRequested(octane),
      EmailReviewMeetingRequestedReminder(octane),
      EmailReviewRequested(octane),
      EmailReviewerChanged(octane),
      EmailReviewRequestedReminder(octane),
    ]);
  }
}
