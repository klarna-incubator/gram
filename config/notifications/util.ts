import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { Review } from "@gram/core/dist/data/reviews/Review";
import System from "@gram/core/dist/data/systems/System";
import { linkToModel } from "@gram/core/dist/util/links";
import Handlebars from "handlebars";
import { getLogger } from "log4js";

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
  review: Review
) {
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

  const [owner, reviewer, requester, fallbackReviewer] = await Promise.all([
    // Lookup Model Owner
    (async () => {
      // TODO: restore this functionality
      // if (system?.team?.accountability_code) {
      //   const team = await getTeam(system.team.accountability_code);
      //   if (team && team.email) {
      //     return {
      //       name: team.name,
      //       email: team.email,
      //     };
      //   }
      // }
      const employee = await dal.userHandler.lookupUser({}, model.createdBy);
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
    link: linkToModel(review.modelId),
    name: `${system ? system.displayName + " - " : ""}${model.version}`,
  };

  return {
    reviewer,
    requester,
    owner,
    fallbackReviewer,
    model: modelInfo,
    missingTeamEmail: missingTeamEmail(owner, review),
    review: {
      note: review.note,
      approvedAt: new Date().toLocaleDateString(),
      updatedAt: new Date().toLocaleDateString(),
      meetingRequestedAt: review.meetingRequestedAt?.toLocaleDateString(),
    },
    playbookLink,
  };
}

export const CoolestTeam = {
  email: "secure-development@klarna.com",
  name: "Secure Development",
};
