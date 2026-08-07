import log4js from "log4js";
import { config } from "../../config/index.js";
import { linkToModel } from "../../util/links.js";
import System from "../systems/System.js";
import { DataAccessLayer } from "../dal.js";
import { NotificationVariables } from "../notifications/NotificationInput.js";
import { Review } from "./Review.js";

const log = log4js.getLogger("notifications");

function missingTeamEmailWarning(ownerName: string): string {
  return `
---

⚠️ Warning: team email for ${ownerName} is not set. Several features rely on this to reach out to your team.
Please set your team's email address so notifications can reach the right people.

---
`;
}

function missingTeamEmail(owner: any, review: Review): string | null {
  if (!owner.email || owner.email === "UNDEFINED") {
    log.warn(
      `Templating a notification for modelId: ${review.modelId}, but email for owner ${owner.name} is not set or undefined (value: ${owner.email})`
    );
    return missingTeamEmailWarning(owner.name);
  }
  return null;
}

/**
 * The deployment's configured support contact (config.contact), shaped as an
 * email recipient. Used to loop in whoever administers this Gram installation on
 * review-lifecycle notifications, and as the fallback identity when the assigned
 * reviewer IS that contact. Returns undefined if no contact is configured, so
 * templates can render without it.
 */
function getSupportContact(): { name: string; email?: string } | undefined {
  if (!config.contact) {
    return undefined;
  }
  return {
    name: config.contact.name,
    email: config.contact.email,
  };
}

/**
 * Resolves the channel-agnostic domain data (review, model, owner, reviewer,
 * requester, contact, playbook link, etc.) shared by every review-lifecycle
 * notification, regardless of which channel(s) ultimately deliver it. Callers
 * (ReviewDataService, KlarnaCronJob) call this directly, right before queuing -
 * this resolution isn't deployment-configurable, so there's no per-key template
 * registry indirecting through it.
 */
export async function buildReviewNotificationVariables(
  dal: DataAccessLayer,
  review: Review
): Promise<NotificationVariables> {
  const model = await dal.modelService.getById(review.modelId);
  if (model === null) {
    throw new Error(
      `Review object has invalid model id: ${review.modelId}. This should not be possible as all reviews are bound to a model. Help?`
    );
  }

  let system: Partial<System> | null = null;

  if (model && model.systemId) {
    system = await dal.systemProvider.getSystem({}, model.systemId);
  }

  const contact = getSupportContact();

  const [owner, reviewer, requester, fallbackReviewer] = await Promise.all([
    // Lookup Model Owner
    (async () => {
      if (system?.owners && system.owners?.length > 0) {
        const team = await dal.teamHandler.getTeam({}, system.owners[0].id);
        if (team && team.email) {
          return {
            name: team.name || "Model Owner",
            email: team.email,
          };
        }
      }
      const employee = await dal.userHandler.lookupUser({}, model.createdBy);
      return {
        name: employee?.name || "Model Owner",
        email: model.createdBy,
      };
    })(),
    // Lookup Reviewer
    (async () => {
      // Handle the special case where the configured support contact is assigned
      // as the reviewer directly.
      if (contact?.email && review.reviewedBy === contact.email) {
        return contact;
      }
      const reviewer = await dal.userHandler.lookupUser({}, review.reviewedBy);
      return {
        email: review.reviewedBy,
        name: reviewer?.name || "Reviewer",
      };
    })(),
    // Lookup Requester
    (async () => {
      const requester = await dal.userHandler.lookupUser(
        {},
        review.requestedBy
      );
      return {
        email: review.requestedBy,
        name: requester?.name || "Requester",
      };
    })(),
    dal.reviewerHandler.getFallbackReviewer({}),
  ]);

  const modelInfo = {
    modelId: review.modelId,
    link: linkToModel(review.modelId),
    name: `${system ? system.displayName + " - " : ""}${model.version}`,
  };

  return {
    reviewer,
    requester,
    owner,
    fallbackReviewer,
    contact,
    system,
    model: modelInfo,
    missingTeamEmail: missingTeamEmail(owner, review),
    review: {
      note: review.note,
      approvedAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      meetingRequestedAt: review.meetingRequestedAt?.toLocaleDateString(),
    },
    playbookLink: config.notifications.playbookUrl,
    sessionBookingLink: config.notifications.sessionBookingUrl,
    reassignAfterDays: config.notifications.reviewReminders?.reassignAfterDays,
  };
}

/**
 * Resolves the previously-assigned reviewer's identity for events (declined,
 * reviewer-changed) that need to reference who the review used to belong to.
 */
export async function lookupPreviousReviewer(
  dal: DataAccessLayer,
  previousReviewer: string | undefined
): Promise<{ name: string; email?: string }> {
  const lookup = previousReviewer
    ? await dal.reviewerHandler.lookupReviewer({}, previousReviewer)
    : null;
  return {
    name: lookup?.name || "unknown",
    email: lookup?.mail,
  };
}
