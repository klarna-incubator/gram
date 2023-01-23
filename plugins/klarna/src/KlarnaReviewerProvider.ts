import config from "config";
import { Reviewer } from "gram-api/src/auth/models/Reviewer";
import { User } from "gram-api/src/auth/models/User";
import { DataAccessLayer } from "gram-api/src/data/dal";
import Model from "gram-api/src/data/models/Model";
import { RequestContext } from "gram-api/src/data/providers/RequestContext";
import { ReviewerProvider } from "gram-api/src/data/reviews/ReviewerProvider";
import { getLogger } from "gram-api/src/logger";
import { HSFContextProvider } from "./HSFContextProvider";
import {
  getDomain,
  getUser,
  LDAPUser,
  listLDAPGroupMembers,
} from "./ldap/lookup";
import { OctaneSystemProvider } from "./system/OctaneSystemProvider";

const log = getLogger("KlarnaReviewerProvider");

const calendarLink =
  "https://calendar.google.com/calendar/u/0/selfsched?sstoken=UUdBOVg2MXlrZ0k1fGRlZmF1bHR8YTQ2YzFlODRlMDk1OGI0YTkxYjY2ZjE5MzljNWQxYzU";

export const fallbackReviewer: Reviewer = {
  sub: "secure-development@klarna.com",
  mail: "secure-development@klarna.com",
  name: "Secure Development",
  recommended: false,
  teams: [],
  calendarLink,
};

const calendarEventTitle = "Threat Modeling Session for <system>";

const calendarEventDescription = `
⚠️ PLEASE CHANGE THE EVENT TIME/DATE AND ADD THE LINK TO YOUR GRAM MODEL BELOW: 
<link here>

📄 For more information about the threat modeling process, please read our documentation at:
https://kep.klarna.net/docs/secure-development/threat_modeling/threat_modeling/
`;

export class KlarnaReviewerProvider implements ReviewerProvider {
  key = "ldap";
  secDevRoundRobinCounter = 0;

  private secdevMembers: Set<string> = new Set();

  constructor(
    private dal: DataAccessLayer,
    private systemProvider: OctaneSystemProvider,
    private hsf: HSFContextProvider
  ) {
    this.loadSecDev();
  }

  async getFallbackReviewer(): Promise<Reviewer> {
    return fallbackReviewer;
  }

  private async loadSecDev(): Promise<void> {
    const members = await listLDAPGroupMembers("access.secure-development");
    this.secdevMembers = new Set(members.map((u) => u.sub));
    log.info(
      `Loaded ${this.secdevMembers.size} secdev members to overload calendar with.`
    );
  }

  private overrideCalendar(u: Reviewer): Reviewer {
    if (this.secdevMembers.has(u.sub)) {
      return { ...u, calendarLink };
    }
    const date = new Date();
    date.setDate(date.getDate() + 7);
    const firstDate = date
      .toISOString()
      .replace(/-/g, "")
      .replace(/:/g, "")
      .replace(/\.[0-9]+/g, "");
    date.setHours(date.getHours() + 1);
    const secondDate = date
      .toISOString()
      .replace(/-/g, "")
      .replace(/:/g, "")
      .replace(/\.[0-9]+/g, "");
    const dates = `${firstDate}/${secondDate}`;
    return {
      ...u,
      calendarLink: `https://calendar.google.com/calendar/render?action=TEMPLATE&dates=${dates}&text=${encodeURIComponent(
        calendarEventTitle
      )}&add=${encodeURIComponent(u.sub)}&details=${encodeURIComponent(
        calendarEventDescription
      )}`,
    };
  }

  async lookup(ctx: RequestContext, userIds: string[]): Promise<Reviewer[]> {
    const users = (
      await Promise.all(userIds.map(async (uid) => await getUser(uid)))
    ).filter((u) => u) as User[];
    users.forEach((u) => log.debug(u));
    const reviewers = users.map((u) => this.overrideCalendar(u as Reviewer));

    if (userIds.includes(fallbackReviewer.sub)) {
      reviewers.push(fallbackReviewer);
    }

    return reviewers;
  }

  async getLdapReviewers(): Promise<LDAPUser[]> {
    const reviewerGroups: string[] = config.get(
      "auth.providerOpts.ldap.roleMap.reviewer"
    );

    let reviewersFromLdap = (
      await Promise.all(
        reviewerGroups.map(
          async (reviewerGroup) => await listLDAPGroupMembers(reviewerGroup)
        )
      )
    ).reduce((p, c) => c.concat(p), []);

    const unique = new Set();
    reviewersFromLdap = reviewersFromLdap.filter((r) => {
      if (unique.has(r.sub)) {
        return false;
      }
      unique.add(r.sub);
      return true;
    });

    log.info(`fetched ${reviewersFromLdap.length} reviewers from ldap`);

    return reviewersFromLdap;
  }

  async getReviewers(): Promise<Reviewer[]> {
    const reviewersFromLdap = await this.getLdapReviewers();

    const reviewers: Reviewer[] = reviewersFromLdap
      .map((r) => ({
        ...r,
        recommended: false,
        teams: [],
      }))
      .map((r) => this.overrideCalendar(r as Reviewer));

    reviewers.push(fallbackReviewer);
    return reviewers;
  }

  async getReviewersForModel(
    ctx: RequestContext,
    model: Model
  ): Promise<Reviewer[]> {
    const reviewersFromLdap = await this.getLdapReviewers();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let recommend = (dn: string) => false;
    // Check if the system is HSF
    const hsfProp = await this.hsf.provideSystemProperties(
      ctx,
      model.systemId,
      false
    );

    if (hsfProp[0].value === "false") {
      // If the system is HSF, we only recommend SecDev. Otherwise we
      // recommend based on the reviewer being in the same domain as
      // the system.
      const system = await this.systemProvider.getOctaneSystem(model.systemId);
      const domain = system?.team?.domain;

      if (domain?.accountability_code !== undefined) {
        const ldapDomain = await getDomain(domain.accountability_code);
        // Create recommendation function based on system domain
        recommend = (dn: string) =>
          ldapDomain ? ldapDomain.memberCns.includes(dn) : false;
      }
    }

    // Map recommendations based on DSLs / Sec Champions
    const isHSF = hsfProp[0].value !== "false";
    const reviewers: Reviewer[] = reviewersFromLdap
      .filter(
        // Only list SecDev as reviewers for HSF systems
        (r) => !isHSF || this.secdevMembers.has(r.sub)
      )
      .map((r) => ({
        ...r,
        recommended: recommend(r.dn),
        teams: [],
      }))
      .map((r) => this.overrideCalendar(r as Reviewer));

    const secdev: Reviewer = {
      ...fallbackReviewer,
      // Recommend SecDev if no other reviewer is recommended
      recommended: !reviewers.reduce((p, c) => p || c.recommended, false),
    };
    reviewers.push(secdev);

    return reviewers;
  }

  async onReviewUpdated(modelId: string) {
    const review = await this.dal.reviewService.getByModelId(modelId);
    if (review?.reviewedBy === fallbackReviewer.sub) {
      const asArray = Array.from(this.secdevMembers);
      const unlucky = asArray[this.secDevRoundRobinCounter];
      this.secDevRoundRobinCounter =
        (this.secDevRoundRobinCounter + 1) % asArray.length;
      log.info(
        `Review for ${modelId} was assigned to ${fallbackReviewer.sub}. Assigning instead to ${unlucky}`
      );
      await this.dal.reviewService.changeReviewer(modelId, unlucky);
    }
  }
}
