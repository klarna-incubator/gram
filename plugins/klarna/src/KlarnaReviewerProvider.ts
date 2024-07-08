import { Reviewer } from "@gram/core/dist/auth/models/Reviewer.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model from "@gram/core/dist/data/models/Model.js";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import {
  JupiterOneSystemPropertyProvider,
  JupiterOneSystemProvider,
} from "@gram/jupiterone";
import {
  LDAPGroupBasedReviewerProvider,
  connectLdapClient,
  escapeFilterValue,
  ldapQuery,
} from "@gram/ldap";
import { LDAPGroupBasedReviewerProviderSettings } from "@gram/ldap/dist/LDAPGroupBasedReviewerProvider.js";
import log4js from "log4js";
import { getDomainMembers } from "./ldap.js";

const log = log4js.getLogger("KlarnaReviewerProvider");

const secdevCalendarLink =
  "https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ0oEj1Db0QiUHOUTkhdAKV0Z1RcN6eGkZE5euU2lwPsZYe3ZMBCcoYceK9cRnCgmmf_XVMcXfgh";

export const fallbackReviewer: Reviewer = {
  sub: "secure-development@klarna.com",
  mail: "secure-development@klarna.com",
  name: "Secure Development",
  recommended: false,
  calendarLink: secdevCalendarLink,
};

const calendarEventTitle = "Threat Modeling Session for <system>";

const calendarEventDescription = `
⚠️ PLEASE CHANGE THE EVENT TIME/DATE AND ADD THE LINK TO YOUR GRAM MODEL BELOW: 
<link here>

📄 For more information about the threat modeling process, please read our documentation at:
https://wiki.klarna.net/wiki/KEP_Wiki_Docs/Secure_Development_-_Threat_Modeling_-_Threat_Modeling_Process
`;

export class KlarnaReviewerProvider extends LDAPGroupBasedReviewerProvider {
  key = "ldap";
  secDevRoundRobinCounter = 0;

  private secdevMembers: Set<string> = new Set();
  private secdevReviewers: Reviewer[] = [];
  private dslMembers: Set<string> = new Set();
  private reviewers: Reviewer[] = [];

  constructor(
    private dal: DataAccessLayer,
    private systemProvider: JupiterOneSystemProvider,
    private hsf: JupiterOneSystemPropertyProvider,
    private ldapProviderSettings: Omit<
      LDAPGroupBasedReviewerProviderSettings,
      "fallbackReviewer"
    >
  ) {
    super({ ...ldapProviderSettings, fallbackReviewer });
    this.preloadReviewers();

    this.dal.reviewService.on("updated-for", ({ modelId }) =>
      this.onReviewUpdated(modelId)
    );
  }

  async lookup(ctx: RequestContext, userIds: string[]): Promise<Reviewer[]> {
    const uids = new Set(userIds);
    return this.reviewers.filter((u) => uids.has(u.sub));
  }

  /**
   * Overrides the calendar of the reviewer with a google calendar link going to their
   * personal account. This assumes the email given is a google account.
   *
   * @param u
   * @returns
   */
  private overrideCalendar(u: Reviewer): Reviewer {
    if (this.secdevMembers.has(u.sub)) {
      return { ...u, calendarLink: secdevCalendarLink };
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

  private async listLDAPGroupMembers(groupId: string): Promise<string[]> {
    const ldap = await connectLdapClient(this.settings.ldapSettings);

    try {
      const entries = await ldapQuery(
        ldap,
        this.settings.groupLookup.searchBase,
        {
          scope: "sub",
          filter: `(&(memberOfGroupId=${escapeFilterValue(
            groupId
          )})(kreditorEnabledUser=TRUE))`,
          attributes: [],
        }
      );

      return entries.searchEntries.map((e) => e["mail"] as string);
    } finally {
      await ldap.unbind();
    }
  }

  public async loadSecDev(): Promise<void> {
    const members = await this.listLDAPGroupMembers(
      "access.secure-development"
    );
    if (!Array.isArray(members) || members.length == 0) {
      log.warn("Got empty secdev group - going to skip this result..");
      return;
    }
    this.secdevMembers = new Set(members);
    log.info(`Loaded ${this.secdevMembers.size} secdev members`);
  }

  public async loadDSL(): Promise<void> {
    const members = await this.listLDAPGroupMembers("domain.security.leads");
    if (!Array.isArray(members) || members.length == 0) {
      log.warn("Got empty dsl group - going to skip this result..");
      return;
    }
    this.dslMembers = new Set(members);
    log.info(`Loaded ${this.dslMembers.size} DSL members`);
  }

  async preloadReviewers(): Promise<void> {
    await this.loadSecDev();
    await this.loadDSL();

    const unique = new Set();
    const newReviewers = (await this._getReviewers({}))
      .filter((r) => {
        if (unique.has(r.sub)) {
          return false;
        }
        unique.add(r.sub);
        return true;
      })
      // Add special case for Lucas Berner as he is in SecDev but should not be assigned reviews.
      .filter((r) => r.sub !== "lucas.berner@klarna.com")
      .filter((r) => r.sub !== "mahiem.agrawal@klarna.com")
      .filter((r) => r.sub !== "alexey.meshcheriakov@klarna.com")
      .map((r) => this.overrideCalendar({ ...r, mail: r.sub }));

    if (newReviewers.length > 0) {
      this.reviewers = newReviewers;
      this.secdevReviewers = newReviewers.filter((r) =>
        this.secdevMembers.has(r.sub)
      );
    }
    log.info(`Loaded ${this.reviewers.length} reviewers from ldap`);
  }

  async _getReviewers(ctx: RequestContext): Promise<Reviewer[]> {
    let reviewers = await super.getReviewers(ctx);
    reviewers.push(fallbackReviewer);
    return reviewers;
  }

  async getReviewers(ctx: RequestContext): Promise<Reviewer[]> {
    return this.reviewers;
  }

  async getDomainMembers(klarnaProjectCode: string) {
    const client = await connectLdapClient(
      this.ldapProviderSettings.ldapSettings
    );

    try {
      return await getDomainMembers(client, klarnaProjectCode);
    } finally {
      client.unbind();
    }
  }

  async getReviewersForModel(
    ctx: RequestContext,
    model: Model
  ): Promise<Reviewer[]> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let recommend = (dn: string) => false;

    // Check if the system is HSF
    const props = model.systemId
      ? await this.hsf.provideSystemProperties(ctx, model.systemId, false)
      : [];
    const isHSF =
      props.find(
        (p: any) => p.id === "system-risk-level" && p.value === "hsf"
      ) !== undefined;

    // Recommend reviewer based on the reviewer being in the same domain as
    // the system.
    const result = model.systemId
      ? await this.systemProvider.getSystemDomain(model.systemId)
      : null;

    const accountabilityCode = result?.properties?.accountabilityCode;

    if (accountabilityCode !== undefined) {
      // TODO: Special case: use domain reviewer group if there's one for that domain.

      // Otherwise compare domain of system to reviewer.
      const members = new Set(await this.getDomainMembers(accountabilityCode));
      // Create recommendation function based on system domain
      recommend = (mail: string) => {
        return members.has(mail);
      };
    }

    // Map recommendations based on DSLs / Sec Champions
    const reviewers = this.reviewers
      .filter(
        // Only list SecDev / DSL as reviewers for HSF systems
        (r) =>
          !isHSF || this.secdevMembers.has(r.sub) || this.dslMembers.has(r.sub)
      )
      .map((r) => ({
        ...r,
        recommended: recommend(r.sub),
        mail: r.sub,
      }));

    reviewers.push({
      ...fallbackReviewer,
      recommended: !reviewers.reduce((p, c) => p || c.recommended, false),
    });

    return reviewers;
  }

  /**
   * Automatically reassign threat models assigned to Secure Development within the team.
   * @param modelId
   */
  async onReviewUpdated(modelId: string) {
    const review = await this.dal.reviewService.getByModelId(modelId);
    if (review?.reviewedBy === fallbackReviewer.sub) {
      const unlucky =
        this.secdevReviewers[
          this.secDevRoundRobinCounter++ % this.secdevReviewers.length
        ];
      log.info(
        `Review for ${modelId} was assigned to ${fallbackReviewer.sub}. Assigning instead to ${unlucky}`
      );
      await this.dal.reviewService.changeReviewer(modelId, unlucky.sub);
    }
  }
}
