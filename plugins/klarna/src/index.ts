import cron from "node-cron";
import { join } from "path";
import { Plugin, PluginRegistrator } from "@gram/core/dist/plugin";
import { ComponentClass } from "@gram/core/dist/data/component-classes";
import classes from "./classes.json";
import { HSFContextProvider } from "./HSFContextProvider";
import { KlarnaAuthzProvider } from "./KlarnaAuthzProvider";
import { KlarnaCronJob } from "./KlarnaCronJob";
import { KlarnaReviewerProvider } from "./KlarnaReviewerProvider";
import { KlarnaUserProvider } from "./KlarnaUserProvider";
import LDAPAuthProvider from "./ldap/LDAPAuthProvider";
import { LDAPCache, testLdapClient } from "./ldap/lookup";
import { EmailReviewApproved } from "./notifications/review-approved";
import { EmailReviewMeetingRequested } from "./notifications/review-meeting-requested";
import { EmailReviewMeetingRequestedReminder } from "./notifications/review-meeting-requested-reminder";
import { EmailReviewRequested } from "./notifications/review-requested";
import { EmailReviewRequestedReminder } from "./notifications/review-requested-reminder";
import { EmailReviewerChanged } from "./notifications/reviewer-changed";
import { createRiskOnThreatModelApprove } from "./RiskManagement";
import { OctaneSystemProvider } from "./system/OctaneSystemProvider";
import { SystemContextProvider } from "./system/SystemContextProvider";
import OktaAuthProvider from "./okta";

const toComponentClass = (o: any): ComponentClass => {
  return {
    id: o.id,
    name: o.name,
    icon: o.icon,
    componentType: o.componentType,
  };
};

const SYSTEM_RELOAD_INTERVAL_MS = 10 * 60 * 1000;
const CACHE_EXPIRY_INTERVAL_MS = 5 * 60 * 1000;

export default class KlarnaPack implements Plugin {
  async bootstrap(reg: PluginRegistrator): Promise<void> {
    await testLdapClient();

    // Register stuff
    reg.registerAssets("klarna", join(__dirname, "assets"));
    const octane = new OctaneSystemProvider();
    octane.loadSystems();
    reg.setSystemProvider(octane);
    const hsf = new HSFContextProvider();
    reg.registerSystemPropertyProvider(hsf);
    reg.registerSystemPropertyProvider(new SystemContextProvider(octane));
    reg.registerComponentClasses(classes.map((logo) => toComponentClass(logo)));
    reg.registerNotificationTemplates([
      EmailReviewApproved(octane),
      EmailReviewMeetingRequested(octane),
      EmailReviewMeetingRequestedReminder(octane),
      EmailReviewRequested(octane),
      EmailReviewerChanged(octane),
      EmailReviewRequestedReminder(octane),
    ]);
    reg.registerAuthProvider(new LDAPAuthProvider());
    reg.registerAuthProvider(new OktaAuthProvider());
    reg.setAuthzProvider(new KlarnaAuthzProvider(reg.dal, octane));
    reg.setUserProvider(new KlarnaUserProvider());

    const reviewerProvider = new KlarnaReviewerProvider(reg.dal, octane, hsf);
    reg.setReviewerProvider(reviewerProvider);
    reg.dal.reviewService.on("updated-for", ({ modelId }) =>
      reviewerProvider.onReviewUpdated(modelId)
    );

    const riskMgmtListener = await createRiskOnThreatModelApprove(
      reg.dal,
      octane
    );
    if (riskMgmtListener) {
      reg.dal.reviewService.on("approved", riskMgmtListener);
    }

    setInterval(() => octane.loadSystems(), SYSTEM_RELOAD_INTERVAL_MS);
    setInterval(() => LDAPCache.expire(), CACHE_EXPIRY_INTERVAL_MS);

    // cron jobs
    cron.schedule("0 6 * * *", async () => {
      // runs every day at 06:00 AM
      const cronJobs = new KlarnaCronJob(reg.dal);
      await cronJobs.sendRemindersForMeetingRequested();
      await cronJobs.sendRemindersForRequested();
      await cronJobs.reassignOverdueReviews();
    });
  }
}
