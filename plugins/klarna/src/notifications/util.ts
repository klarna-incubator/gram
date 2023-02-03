import Handlebars from "handlebars";
import { lookupUser } from "@gram/core/dist/auth/user";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { Review } from "@gram/core/dist/data/reviews/Review";
import { getLogger } from "@gram/core/dist/logger";
import { linkToModel } from "@gram/core/dist/util/links";
import { getTeam } from "../ldap/lookup";
import {
  OctaneSystem,
  OctaneSystemProvider,
} from "../system/OctaneSystemProvider";

const missingTeamEmailTemplate = Handlebars.compile(`
--- 

⚠️ Warning: team email for {{ownerName}} is not set. While trying to send this email, we noticed that your 
team email is not set. Several internal applications at Klarna use this to reach out to your team.
To set your team email, you can use this form: 
https://jira.int.klarna.net/jira/plugins/servlet/desk/portal/44/create/1488

---
`);

const logger = getLogger("klarna-pack-notifications");

const playbookLink =
  "https://docs.google.com/document/d/1fWJqeZBqP4GQfPpH7tCvvpdCa1ls261PO1dmYDlJrkw/edit?usp=sharing";

function missingTeamEmail(owner: any, review: Review) {
  if (!owner.email || owner.email === "UNDEFINED") {
    logger.warn(
      `Templating a notification for modelId: ${review.modelId}, but email for owner ${owner.name} is not set or undefined (value: ${owner.email})`
    );
    return missingTeamEmailTemplate({ ownerName: owner.name });
  }
  return undefined;
}

export async function generalReviewNotificationVariables(
  dal: DataAccessLayer,
  review: Review,
  systemProvider: OctaneSystemProvider
) {
  const model = await dal.modelService.getById(review.modelId);
  if (model === null) {
    throw new Error(
      `Review object has invalid model id: ${review.modelId}. This should not be possible as all reviews are bound to a model. Help?`
    );
  }

  let system: Partial<OctaneSystem> | null = null;

  if (model && model.systemId) {
    system = await systemProvider.getOctaneSystem(model.systemId);
  }

  const [owner, reviewer, requester] = await Promise.all([
    // Lookup Model Owner
    (async () => {
      if (system?.team?.accountability_code) {
        const team = await getTeam(system.team.accountability_code);
        if (team && team.email) {
          return {
            name: team.name,
            email: team.email,
          };
        }
      }
      const employee = await lookupUser({}, model.createdBy);
      return {
        name: employee?.name || "Model Owner",
        email: model.createdBy,
      };
    })(),
    // Lookup Reviewer
    (async () => {
      // Handle the special case where Secure Development team is assigned
      if (review.reviewedBy === CoolestTeam.email) {
        return CoolestTeam;
      }
      const reviewer = await lookupUser({}, review.reviewedBy);
      return {
        email: review.reviewedBy,
        name: reviewer?.name || "Reviewer",
      };
    })(),
    // Lookup Requester
    (async () => {
      const requester = await lookupUser({}, review.requestedBy);
      return {
        email: review.requestedBy,
        name: requester?.name || "Requester",
      };
    })(),
  ]);

  const modelInfo = {
    link: linkToModel(review.modelId),
    name: `${system ? system.name + " - " : ""}${model.version}`,
  };

  return {
    reviewer,
    requester,
    owner,
    model: modelInfo,
    missingTeamEmail: missingTeamEmail(owner, review),
    review: {
      note: review.note,
      approvedAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      meetingRequestedAt: review.meetingRequestedAt
        ? review.meetingRequestedAt.toLocaleDateString()
        : null,
    },
    playbookLink,
  };
}

export const CoolestTeam = {
  email: "secure-development@klarna.com",
  name: "Secure Development",
};
