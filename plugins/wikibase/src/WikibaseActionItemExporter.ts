import {
  PROPERTIES,
  INSTANCE_OF_LIST,
  NEW,
  InstanceOfListType,
  REPORTER_TEAM_TYPE,
  PRIORITY_TYPE,
  SECURE_DEVELOPMENT_ORG_UNIT,
  QUALIFIERS,
  SECURITY_ENABLEMENT_ORG_UNIT,
} from "./WikibaseConstants.js";
import { WikibaseEditClient } from "./WikibaseEditClient.js";
import { WikibaseSdkClient } from "./WikibaseSdkClient.js";
import Threat, { ThreatSeverity } from "@gram/core/dist/data/threats/Threat.js";
import { ActionItemExporter } from "@gram/core/dist/action-items/ActionItemExporter.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Link, LinkObjectType } from "@gram/core/dist/data/links/Link.js";
import log4js from "log4js";
import { EntityId, PropertyId } from "wikibase-sdk";

const log = log4js.getLogger("WikibaseActionItemExporter");

export class ThreatModelFinding {
  type: string;
  id!: EntityId;
  instanceOf: InstanceOfListType;
  accountableTeam!: EntityId;
  accountableContributor!: EntityId;
  reporterTeam!: REPORTER_TEAM_TYPE;
  reporterContributor!: EntityId;
  status!: EntityId;
  dueDate!: string; // ISO 8601 date string
  reporterEstimatedEffort!: number; // in days
  priorityRank!: PRIORITY_TYPE;
  relatedTo!: EntityId;
  suggestedSolution!: string;

  constructor(
    public label: string,
    public description: string,
    public systemId: string,
    public modelId: string
  ) {
    this.systemId = systemId;
    this.modelId = modelId;
    this.label = `[${this.systemId}] ${label}`;
    this.description = description;
    this.type = "item";
    this.instanceOf = [...INSTANCE_OF_LIST];
  }

  toJSON() {
    return {
      type: this.type,
      labels: {
        en: this.label,
      },
      descriptions: {
        en: this.description,
      },
      claims: {
        [PROPERTIES.INSTANCE_OF]: this.instanceOf,
        [PROPERTIES.ACCOUNTABLE]: this.accountableTeam,
        [PROPERTIES.REPORTER_TEAM]: this.reporterTeam,
        [PROPERTIES.ENTITY_CREATED_ON]: new Date().toISOString().split("T")[0],
        [PROPERTIES.PRIORITY_RANK]: this.priorityRank,
        [PROPERTIES.RELATED_TO]: this.relatedTo,
        [PROPERTIES.OBSERVED_ISSUE]: this.description,
        [PROPERTIES.SUGGESTED_SOLUTION]: this.suggestedSolution,
        [PROPERTIES.STATUS]: NEW,
        [PROPERTIES.DUE_DATE]: new Date().toISOString().split("T")[0], // TBD: set due date based on SLA
        [PROPERTIES.REPORTED_ESTIMATED_EFFORT]: 1,
      },
    };
  }

  getQualifiers(): Record<PropertyId, Record<PropertyId, EntityId | string>> {
    return {
      [PROPERTIES.ACCOUNTABLE]: {
        [QUALIFIERS.CONTRIBUTOR]: this.accountableContributor,
      },
      [PROPERTIES.REPORTER_TEAM]: {
        [QUALIFIERS.CONTRIBUTOR]: this.reporterContributor,
      },
      [PROPERTIES.OBSERVED_ISSUE]: {
        [QUALIFIERS.URL]: `https://gram.klarna.net/model/${this.modelId}`,
      },
    };
  }
}

export class WikibaseActionItemExporter implements ActionItemExporter {
  // ActionItemExporter
  key: string = "wikibase";
  exportOnReviewApproved: boolean = false;
  wikibaseClient: WikibaseEditClient = new WikibaseEditClient();
  wikibaseSdkClient: WikibaseSdkClient = new WikibaseSdkClient();
  constructor(private dal: DataAccessLayer) {}

  async convertActionItemToFinding(
    dal: DataAccessLayer,
    actionItem: Threat
  ): Promise<ThreatModelFinding> {
    const severityToPriorityMap: Record<ThreatSeverity, PRIORITY_TYPE> = {
      [ThreatSeverity.Critical]: 1,
      [ThreatSeverity.High]: 2,
      [ThreatSeverity.Medium]: 3,
      [ThreatSeverity.Low]: 3, // Not used as low severity items are skipped
      [ThreatSeverity.Informative]: 3, // Not used as informative severity items are skipped
    };
    // Find the team owning the system in scope
    const model = await dal.modelService.getById(actionItem.modelId);
    const systemId = model ? model.systemId : null;

    const finding = new ThreatModelFinding(
      `${actionItem.title}`,
      actionItem.description,
      systemId || "Unknown System",
      actionItem.modelId
    );

    // Find the system QID
    const systemQID = await this.wikibaseSdkClient.getSystemQID(
      model?.systemId!
    );

    if (!systemQID) {
      log.warn(
        `Could not find system QID for system ID ${model?.systemId}, skipping accountable team assignment.`
      );
    } else {
      // Assign the system QID to related to field
      finding.relatedTo = systemQID;

      // Find the accountable team for the system
      const systemClaims = await this.wikibaseSdkClient.getItemDetails(
        systemQID,
        [PROPERTIES.ACCOUNTABLE]
      );

      if (systemClaims && PROPERTIES.ACCOUNTABLE in systemClaims) {
        finding.accountableTeam = systemClaims[PROPERTIES.ACCOUNTABLE][0];
        log.debug(
          `Found accountable team QID ${systemClaims} for system QID ${systemQID}.`
        );
      } else {
        log.warn(
          `Could not find accountable team QID for system QID ${systemQID}, skipping accountable team assignment.`
        );
      }
    }

    //Find the reporter contributor and team
    const review = await this.dal.reviewService.getByModelId(
      actionItem.modelId
    );

    if (!review) {
      log.info(
        `Could not find review for model ${actionItem.modelId}, using token user as reporter`
      );
    }

    const reporterContributorEmail = review?.reviewedBy;

    const reporterContributorQID =
      await this.wikibaseSdkClient.getUserQIDFromEmail(
        reporterContributorEmail!
      );

    if (!reporterContributorQID || reporterContributorQID === null) {
      log.warn(
        `Could not find reporter contributor QID for email ${reporterContributorEmail}, skipping reporter contributor assignment.`
      );
    } else {
      log.debug(
        `Found reporter contributor QID ${reporterContributorQID} for email ${reporterContributorEmail}.`
      );
      finding.reporterContributor = reporterContributorQID;
    }

    // Find the reporter's team
    // Default to Secure Development org unit
    let reporterTeamQID = SECURE_DEVELOPMENT_ORG_UNIT;

    if (reporterContributorEmail) {
      try {
        const teams = await dal.teamHandler.getTeamsForUser(
          { currentRequest: undefined },
          reporterContributorEmail
        );
        if (teams && teams.length > 0) {
          // If multiple teams, pick the first one (or implement logic as needed)
          reporterTeamQID = teams[0].id;
          const isDSLTeam = teams.some((team) =>
            team.name.toLowerCase().includes("security enablement")
          );
          // If reporter is part of DSL team, set reporter team to Security Enablement org unit
          if (isDSLTeam) {
            log.info(
              `Reporter ${reporterContributorEmail} is part of Security Enablement team, setting reporter team to Security Enablement org unit.`
            );
            reporterTeamQID = SECURITY_ENABLEMENT_ORG_UNIT;
          }
        }
      } catch (err) {
        log.warn(
          `Failed to get reporter team for email ${reporterContributorEmail}: ${err}`
        );
      }
    }

    finding.dueDate = new Date().toISOString().split("T")[0];
    finding.reporterEstimatedEffort = 1;
    finding.priorityRank = actionItem.severity
      ? severityToPriorityMap[actionItem.severity]
      : 3; // Calculate priority based on severity

    // Find associated controls
    const controls = await dal.controlService.listByThreatId(actionItem.id!);
    if (controls.length === 0) {
      log.warn(`No controls found associated with threat ID ${actionItem.id}`);
      finding.suggestedSolution =
        "No suggested solutions available. Please contact the reporter contributor for more information.";
    } else {
      log.debug(
        `Found ${controls.length} controls associated with action item ${actionItem.id}`
      );
      const suggestedSolutions = controls
        .map((control, idx) => {
          `Control #${idx + 1}: ${control.title} - ${control.description}`;
        })
        .join("; ");
      finding.suggestedSolution = suggestedSolutions;
    }

    return finding;
  }

  async createThreatModelFinding(
    dal: DataAccessLayer,
    actionItem: Threat
  ): Promise<any> {
    try {
      // Convert action item to Threat Model Finding
      log.debug(`Converting action item to Threat Model Finding...`);
      const finding = await this.convertActionItemToFinding(dal, actionItem);

      // Check if item already exists in Wikibase
      const itemId = await this.wikibaseSdkClient.getItemQID(finding.label);

      if (itemId) {
        actionItem.id = itemId;
        log.info(`Item already exists in Wikibase: ${finding.label}`);
        // Edit the existing item
        await this.wikibaseClient.editItem(finding);
        log.info(
          `Item has been updated. https://knowledgegraph.klarna.net/wiki/Item:${actionItem.id}`
        );
        return null;
      }
      log.info(`Creating new Threat Model Finding in Wikibase...`);

      return await this.wikibaseClient.createItem(finding);
    } catch (error) {
      log.error(
        `Error converting action item ${actionItem.id} to Threat Model Finding: ${error}`
      );
      throw error;
    }
  }

  async export(dal: DataAccessLayer, actionItems: Threat[]): Promise<void> {
    // Export action items to Wikibase

    await Promise.all(
      actionItems.map(async (item) => {
        // Skip item if severity is Informative or Low
        if (
          !item.severity ||
          [ThreatSeverity.Informative, ThreatSeverity.Low].includes(
            item.severity
          )
        ) {
          log.info(`Skipping action item (low severity): ${item.title}`);
          return;
        }

        // Check if link already exists
        const links = await dal.linkService.listLinks(
          LinkObjectType.Threat,
          item.id!
        );

        if (links.length > 0) {
          const wikibaseLinkExists = links.filter(
            (e) =>
              e.createdBy === this.key ||
              e.url.includes("knowledgegraph.klarna.net")
          );
          const jiraLinkExists = links.filter((e) => e.createdBy === this.key);

          // Check if a link to Wikibase already exists
          if (wikibaseLinkExists.length > 0) {
            // TODO: Update logic to update existing Wikibase item if needed. TM reviewers should do it manually for now.
            log.info(
              `Action item ${item.id} is already exported to one or more tickets. Skipping export.`
            );
            return;
          } else if (jiraLinkExists.length > 0) {
            // TODO: Fetch Wikibase finding linked to the Jira ticket, if exist and link it to action item. TM reviewers should do it manually for now.
            log.info(`Action item ${item.id} is exported to JIRA.`);
            //return;
          }
        }

        const exportedItem = await this.createThreatModelFinding(dal, item);
        if (exportedItem) {
          log.info(
            `Exported action item to Wikibase: ${exportedItem.entity.id}`
          );
        }
      })
    );

    //Only export action items with severity Medium and above
    for (const item of actionItems) {
      // Logic to export each action item to Wikibase
      log.info(`Exporting action item: ${item.title}`);
      // Placeholder for actual export logic
    }
  }
}
