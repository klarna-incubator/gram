import { Reviewer } from "@gram/core/dist/auth/models/Reviewer.js";
import Model from "@gram/core/dist/data/models/Model.js";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import { ReviewerProvider } from "@gram/core/dist/data/reviews/ReviewerProvider.js";
import log4js from "log4js";
import { getUserInfo, extractGroups } from "./util.js";
import { OIDCUserStore } from "./OIDCUserStore.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";

const log = log4js.getLogger("OIDCGroupBasedReviewerProvider");

export interface OIDCReviewerProviderSettings {
  /**
   * Name of the claim that contains group information
   */
  groupsClaimName: string;
  /**
   * Groups that contain reviewers
   */
  reviewerGroups: string[];
  /**
   * Mapping function to convert user info to Reviewer object
   */
  userInfoToReviewer: (userInfo: any) => Reviewer;
  /**
   * Fallback reviewer when no reviewers are found
   */
  fallbackReviewer: string | Reviewer;
}

export class OIDCGroupBasedReviewerProvider implements ReviewerProvider {
  constructor(
    private dal: DataAccessLayer,
    public settings: OIDCReviewerProviderSettings
  ) {}

  async lookup(ctx: RequestContext, userIds: string[]): Promise<Reviewer[]> {
    const reviewers = await Promise.all(
      userIds.map((uid) => this.getReviewer(uid))
    );
    return reviewers.filter((r) => r).map((r) => r as Reviewer);
  }

  async getReviewer(userId: string): Promise<Reviewer | null> {
    const userInfo = await getUserInfo(this.dal, userId, log);

    if (!userInfo) {
      return null;
    }

    // Check if user is actually a reviewer based on their groups
    if (!this.isReviewer(userInfo)) {
      log.debug(`User ${userId} is not in any reviewer groups`);
      return null;
    }

    log.debug(`Found stored reviewer info for user ${userId}`);
    return this.settings.userInfoToReviewer(userInfo);
  }

  async getReviewersForModel(
    ctx: RequestContext,
    model: Model
  ): Promise<Reviewer[]> {
    return this.getReviewers(ctx);
  }

  async getReviewers(ctx: RequestContext): Promise<Reviewer[]> {
    try {
      const userStore = OIDCUserStore.getInstance(this.dal);
      const reviewers: Reviewer[] = [];
      const seenUsers = new Set<string>(); // Track users to avoid duplicates

      log.debug(
        `Getting reviewers from groups: ${this.settings.reviewerGroups.join(
          ", "
        )}`
      );

      // Get all users from reviewer groups
      for (const groupName of this.settings.reviewerGroups) {
        const usersInGroup = await userStore.getUsersInGroup(groupName);
        log.debug(
          `Found ${usersInGroup.length} users in reviewer group ${groupName}`
        );

        for (const userSub of usersInGroup) {
          // Skip if we've already processed this user
          if (seenUsers.has(userSub)) {
            continue;
          }
          seenUsers.add(userSub);

          // Get full user info
          const userInfo = await getUserInfo(this.dal, userSub, log);
          if (!userInfo) {
            log.warn(
              `User ${userSub} found in group but no user info available`
            );
            continue;
          }

          // Verify user is still a reviewer (in case groups changed)
          if (!this.isReviewer(userInfo)) {
            log.debug(`User ${userSub} no longer in reviewer groups, skipping`);
            continue;
          }

          // Convert to reviewer object
          try {
            const reviewer = this.settings.userInfoToReviewer(userInfo);
            reviewers.push(reviewer);
            log.debug(`Added reviewer: ${reviewer.name} (${reviewer.sub})`);
          } catch (error) {
            log.error(`Error converting user ${userSub} to reviewer:`, error);
          }
        }
      }

      log.debug(`Found ${reviewers.length} total reviewers`);

      // If no reviewers found, include fallback reviewer
      if (reviewers.length === 0) {
        log.debug("No reviewers found, adding fallback reviewer");
        const fallbackReviewer = await this.getFallbackReviewer(ctx);
        reviewers.push(fallbackReviewer);
      }

      return reviewers;
    } catch (error) {
      log.error("Error getting reviewers:", error);

      // Return fallback reviewer in case of error
      try {
        const fallbackReviewer = await this.getFallbackReviewer(ctx);
        return [fallbackReviewer];
      } catch (fallbackError) {
        log.error("Error getting fallback reviewer:", fallbackError);
        return [];
      }
    }
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

  private isReviewer(userInfo: any): boolean {
    const groups = extractGroups(userInfo, this.settings.groupsClaimName);
    return groups.some((group) => this.settings.reviewerGroups.includes(group));
  }

  key = "oidc-group";
}
