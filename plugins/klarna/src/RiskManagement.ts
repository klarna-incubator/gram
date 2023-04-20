import config from "config";
import JiraApi from "jira-client";
import { getLogger } from "log4js";
import Control from "@gram/core/dist/data/controls/Control";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import Mitigation from "@gram/core/dist/data/mitigations/Mitigation";
import { Component } from "@gram/core/dist/data/models/Model";
import { Review } from "@gram/core/dist/data/reviews/Review";
import Threat from "@gram/core/dist/data/threats/Threat";
import secrets from "@gram/core/dist/secrets";
import { linkToModel } from "@gram/core/dist/util/links";
import {
  OctaneSystem,
  OctaneSystemProvider,
} from "./system/OctaneSystemProvider";

const log = getLogger("RiskManagement");

interface ActionItem {
  threat: Threat;
  component?: Component;
  controls: Control[];
}

export async function createRiskOnThreatModelApprove(
  dal: DataAccessLayer,
  systemProvider: OctaneSystemProvider
) {
  const jiraToken = await secrets.getOrDefault("jira.token", undefined);
  const jiraUser = await secrets.getOrDefault("jira.user", undefined);
  const jiraPassword = await secrets.getOrDefault("jira.password", undefined);

  if (!(jiraToken || (jiraUser && jiraPassword))) {
    log.info(
      "Jira token or user/password not found. Skipping risk management."
    );
    return;
  }

  const jiraHost = config.get<string>("jira.host");

  if (!jiraHost) {
    log.info("Jira host not configured. Skipping risk management");
    return;
  }

  const jira = new JiraApi({
    protocol: "https",
    host: jiraHost,
    bearer: jiraToken,
    username: jiraUser,
    password: jiraPassword,
    apiVersion: "2",
    strictSSL: true,
  });

  const onApproveListener = async ({ review }: { review: Review }) => {
    log.debug("createRiskOnThreatModelApprove", review);

    const url = linkToModel(review.modelId);

    const data = await fetchModel(dal, review.modelId);

    if (!data) {
      log.warn(
        `Failed to fetch necessary threat model data for review ${review.modelId}`
      );
      return;
    }

    const { systemId, threats, controls, mitigations, model } = data;

    if (!systemId) {
      log.info("Not creating a risk ticket for non-system threat model");
      return;
    }

    const complementedThreats = threats
      .filter((th: Threat) => th.isActionItem)
      .map((th: Threat): ActionItem => {
        const controlMap = mitigations
          .filter((m: Mitigation) => m.threatId === th.id)
          .map((m: Mitigation) => m.controlId);

        return {
          threat: th,
          component: model.data.components.find(
            (c: Component) => c.id === th.componentId
          ),
          controls: controls.filter((c: Control) =>
            controlMap.includes(c.id as string)
          ),
        };
      });

    if (complementedThreats.length === 0) {
      log.info("No threats marked as action items - skipping the risk ticket.");
      return;
    }

    const system = await systemProvider.getOctaneSystem(systemId);

    if (!system) {
      log.warn(`Could not find a system for id ${systemId}`);
      return;
    }

    const residualImpact = residualImpactMap.get(
      review.extras.impact as string
    );
    const residualLikelihood = residualLikelihoodMap.get(
      review.extras.likelihood as string
    );

    if (!residualImpact || !residualLikelihood) {
      log.warn("could not map residual impact or likelihood", {
        extras: review.extras,
        residualLikelihood,
        residualImpact,
      });
      return;
    }

    const issueId = await createRiskTicket(
      jira,
      system,
      review.reviewedBy,
      url,
      complementedThreats,
      residualImpact,
      residualLikelihood
    );

    await jira.transitionIssue(issueId, {
      transition: { id: "201" },
    });
  };

  /**
   * Wrap in try/catch to prevent application from crashing if the creation fails.
   * @param param0
   * @returns
   */
  const wrapped = async ({ review }: { review: Review }) => {
    try {
      return await onApproveListener({ review });
    } catch (ex) {
      log.error(ex);
    }
  };

  return wrapped;
}

async function fetchModel(dal: DataAccessLayer, modelId: string) {
  const model = await dal.modelService.getById(modelId);

  if (!model) {
    return null;
  }
  log.debug("Fetched model data");

  const threats = await dal.threatService.listActionItems(modelId);
  log.debug(`Fetched ${threats.length} threats`);

  const controls = await dal.controlService.list(modelId);
  log.debug(`Fetched ${threats.length} controls`);

  const mitigations = await dal.mitigationService.list(modelId);
  log.debug(
    `Fetched ${mitigations.length} mitigations (control<->threat mappings)`
  );

  return { systemId: model.systemId, threats, controls, model, mitigations };
}

async function createRiskTicket(
  jira: JiraApi,
  system: Partial<OctaneSystem>,
  reporterEmail: string,
  threatModelUrl: string,
  actionItems: ActionItem[],
  residualImpact: string,
  residualLikelihood: string
) {
  // When the switch is made to Jira cloud:
  // jira.genericGet(`/rest/api/3/user/search?query=joakim.uddholm@klarna.com`);

  const reporterUsername = reporterEmail.replace("@klarna.com", "");
  log.info(`create risk ticket with ${reporterUsername} as reporter`);
  const description = `Risk of security weakness to a Klarna System due to design flaws, affecting/impacting System “${system.system_id}” and systems that depend on it leading to loss of confidentiality, integrity or availability.
  
  Original reporter: ${reporterUsername}`;

  const issue = {
    fields: {
      project: {
        key: "RISK",
      },
      issuetype: {
        id: "10701",
      },
      summary:
        "Risk(s) of security weakness due to design flaw found during threat modeling",

      // Reporter
      reporter: { name: reporterUsername },
      // description,

      // Markets
      customfield_26231: [{ key: "KO-506" }],
      // Risk Source
      customfield_26037: [{ key: "RC-4026941" }],
      // Risk Category
      customfield_36048: [{ key: "RC-5980662" }],
      // Klarna Domain(s)
      customfield_21531: [{ value: "AUTOMATIC-ASSIGN" }],
      // Target impact
      customfield_21993: { id: "23274" },
      // Target Likelihood
      customfield_21992: { id: "23268" },
      // Impact category
      customfield_26036: [{ key: "RC-5575431" }],
      // Financial impact
      customfield_29031: { id: "30420" },

      // Originates from
      customfield_39937:
        config.get<string>("jira.host").indexOf("staging") > -1
          ? undefined
          : [{ key: "RC-7088236" }],

      /* */
      // customfield_21980: -1,
      // customfield_21982: -1,

      // fieldsToRetain=project
      // fieldsToRetain=issuetype&fieldsToRetain=customfield_19331&fieldsToRetain=customfield_25033&fieldsToRetain=customfield_14930&fieldsToRetain=customfield_30235&fieldsToRetain=customfield_27747&fieldsToRetain=customfield_21987&fieldsToRetain=customfield_26231&fieldsToRetain=customfield_26037&fieldsToRetain=customfield_36048&fieldsToRetain=customfield_21735&fieldsToRetain=customfield_21531&fieldsToRetain=customfield_21983&fieldsToRetain=customfield_21981&fieldsToRetain=customfield_21993&fieldsToRetain=customfield_21992&fieldsToRetain=customfield_26036&fieldsToRetain=customfield_29031&fieldsToRetain=assignee&fieldsToRetain=customfield_31530&fieldsToRetain=customfield_31531&fieldsToRetain=issuelinks&fieldsToRetain=customfield_13034&fieldsToRetain=customfield_22536&fieldsToRetain=customfield_21980&fieldsToRetain=customfield_21982&fieldsToRetain=customfield_19430&fieldsToRetain=customfield_39531&fieldsToRetain=customfield_39937

      /* Non-static fields */

      // Responsible Team
      customfield_21735: [{ key: system?.team?.key }],
      // Klarna System(s)
      customfield_19430: [{ key: system.key }],
      // Assignee
      assignee: { name: system?.team?.manager?.username },

      // Risk Description
      customfield_27747: description,
      // Existing Mitigation
      customfield_21987: `Threat Model describing controls already in place: ${threatModelUrl}`,
      // Residual Likelihood
      customfield_21983: { id: residualLikelihood },
      // Residual Impact
      customfield_21981: { id: residualImpact },
    },
  };

  log.debug("creating issue", issue);

  const ticket = await jira.addNewIssue(issue);
  log.debug("issue created:", ticket);

  const respRemoteLink = await jira.createRemoteLink(ticket.key, {
    object: {
      url: threatModelUrl,
      title: "Threat Model",
    },
  });

  log.debug("created web link", respRemoteLink);

  log.info(
    "url",
    `https://${config.get<string>("jira.host")}/browse/${ticket.key}`
  );

  // //
  //customfield_10091=399211
  await createRiskActions(
    jira,
    actionItems,
    system,
    ticket.key,
    reporterUsername
  );

  //   console.log("Here is your risk ticket:");
  //   console.log("https://jira.int.klarna.net/jira/browse/" + ticket.key);
  //   console.log("Don't forget to mark Assessment Done!");
  return ticket.key;
}

const residualImpactMap = new Map([
  ["Very high", "23266"],
  ["High", "23265"],
  ["Medium", "23264"],
  ["Low", "23263"],
  ["Very low", "23262"],
]);

const residualLikelihoodMap = new Map([
  ["Almost certain", "23041"],
  ["Likely", "23040"],
  ["Occasional", "23039"],
  ["Unlikely", "23038"],
  ["Rare", "23037"],
]);

async function createRiskActions(
  jira: JiraApi,
  actionItems: ActionItem[],
  system: Partial<OctaneSystem>,
  riskTicketKey: string,
  reporterUsername: string
) {
  await Promise.all(
    actionItems.map(async (actionItem: ActionItem) => {
      const issue = {
        fields: {
          project: {
            key: "RISK",
          },
          issuetype: {
            id: "14302",
          },
          reporter: { name: reporterUsername },
          // Domain
          customfield_21531: [{ value: "AUTOMATIC-ASSIGN" }],
          // Responsible Team
          customfield_21735: [{ key: system?.team?.key }],
          // Klarna System(s)
          customfield_19430: [{ key: system.key }],
          // Severity
          // <option value="-1">None</option>
          // <option value="39919">Minor</option>
          // <option value="39920">Moderate</option>
          // <option selected="selected" value="39921">Major</option>
          // <option value="39922">Critical</option>
          customfield_10091:
            config.get<string>("jira.host").indexOf("staging") > -1
              ? { id: "39172" }
              : { id: "39920" },
          assignee: { name: system?.team?.manager?.username },

          summary: `Mitigate Threat of ${actionItem.threat.title} on ${actionItem.component?.name}`,
          description: `To mitigate the threat of ${
            actionItem.threat.title
          } on ${
            actionItem.component?.name
          }, the following controls have been proposed in a threat modeling session. 

${actionItem.controls
  .map((c: any) => `* ${c.title} ${c.inPlace ? "(already in place)" : ""}\n`)
  .join("\n")}

This risk action can be marked as complete when you feel that the threat has been sufficiently mitigated.`,
        },
      };
      log.debug("creating issue", issue);
      const action = await jira.addNewIssue(issue);
      log.debug("issue created:", action);
      const resp = await jira.issueLink({
        type: {
          name: "Treatment",
        },
        outwardIssue: {
          key: riskTicketKey,
        },
        inwardIssue: {
          key: action.key,
        },
      });
      log.debug("action linked to original ticket", resp);
      log.debug("url", "https://jira.int.klarna.net/jira/browse/" + action.key);
    })
  );
}
