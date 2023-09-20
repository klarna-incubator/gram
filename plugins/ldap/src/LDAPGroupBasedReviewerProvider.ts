import { Reviewer } from "@gram/core/dist/auth/models/Reviewer";
import Model from "@gram/core/dist/data/models/Model";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { ReviewerProvider } from "@gram/core/dist/data/reviews/ReviewerProvider";
import { Entry } from "ldapts";
import { getLogger } from "log4js";
import { LDAPClientSettings } from "./LDAPClientSettings";
import { connectLdapClient, ldapQuery, ldapQueryOne } from "./lookup";
import { escapeFilterValue } from "./util";

export interface LDAPGroupBasedReviewerProviderSettings {
  ldapSettings: LDAPClientSettings;
  reviewerLookup: {
    searchBase: string;
    searchFilter: (sub: string) => string;
    attributes: string[];
    attributesToReviewer: (ldapEntry: Entry) => Promise<Reviewer>;
  };
  groupLookup: {
    searchBase: string;
    /**
     * LDAP Entries returned by these filters will be considered as reviewers.
     * Should be provided as raw LDAP search filters.
     */
    groupFilters: string[];
    attributes: string[];
    attributesToReviewer: (ldapEntry: Entry) => Promise<Reviewer>;
  };
  /**
   * Sub/UserID or Reviewer object of a fallback reviewer
   */
  fallbackReviewer: string | Reviewer;
}

export class LDAPGroupBasedReviewerProvider implements ReviewerProvider {
  constructor(public settings: LDAPGroupBasedReviewerProviderSettings) {}

  async lookup(ctx: RequestContext, userIds: string[]): Promise<Reviewer[]> {
    // Inefficent O(n) lookup here. Could potentially be improved by using a single query.
    const reviewers = await Promise.all(
      userIds.map((uid) => this.getReviewer(uid))
    );
    return reviewers.filter((u) => u).map((u) => u as Reviewer);
  }

  async getReviewer(userId: string): Promise<Reviewer | null> {
    const escapedUserId = escapeFilterValue(userId);
    const ldap = await connectLdapClient(this.settings.ldapSettings);

    try {
      const entry = await ldapQueryOne(
        ldap,
        this.settings.reviewerLookup.searchBase,
        {
          scope: "sub",
          filter: this.settings.reviewerLookup.searchFilter(escapedUserId),
          attributes: [...this.settings.reviewerLookup.attributes],
        }
      );

      if (!entry) {
        return null;
      }

      return this.settings.reviewerLookup.attributesToReviewer(entry);
    } finally {
      await ldap.unbind();
    }
  }

  async getReviewersForModel(
    ctx: RequestContext,
    model: Model
  ): Promise<Reviewer[]> {
    return this.getReviewers(ctx);
  }

  async getGroup(groupFilter: string): Promise<Reviewer[]> {
    const ldap = await connectLdapClient(this.settings.ldapSettings);

    try {
      const entries = await ldapQuery(
        ldap,
        this.settings.groupLookup.searchBase,
        {
          scope: "sub",
          filter: groupFilter,
          attributes: [...this.settings.groupLookup.attributes],
        }
      );

      const reviewers = await Promise.all(
        entries.searchEntries.map((e) =>
          this.settings.groupLookup.attributesToReviewer(e)
        )
      );

      return reviewers;
    } finally {
      await ldap.unbind();
    }
  }

  async getReviewers(ctx: RequestContext): Promise<Reviewer[]> {
    const seen = new Set();

    const reviewerBatches = await Promise.all(
      this.settings.groupLookup.groupFilters.map((gf) => this.getGroup(gf))
    );

    const result: Reviewer[] = [];
    for (const reviewers of reviewerBatches) {
      reviewers.forEach((r) => {
        if (seen.has(r.sub)) {
          return;
        }
        result.push(r);
        seen.add(r.sub);
      });
    }

    return result;
  }

  async getFallbackReviewer(ctx: RequestContext): Promise<Reviewer> {
    if (typeof this.settings.fallbackReviewer === "string") {
      const reviewer = await this.getReviewer(this.settings.fallbackReviewer);
      if (!reviewer) {
        throw new Error(
          `Fallback reviewer with userid ${this.settings.fallbackReviewer} does not exist`
        );
      }
      return reviewer;
    }

    return this.settings.fallbackReviewer;
  }

  key = "ldap-group";
}
