import { ActionItemExporter } from "@gram/core/dist/action-items/ActionItemExporter.js";
import type { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Threat, { ThreatSeverity } from "@gram/core/dist/data/threats/Threat.js";
import { WikibaseSdkClient } from "@gram/wikibase/dist/WikibaseSdkClient.js";
import log4js from "log4js";
import { SuccessDashboardApiClient } from "./SuccessDashboardApiClient.js";
import {
  SKIP_REASONS,
  LOW_SEVERITIES,
  SUCCESS_DASHBOARD_URL_DOMAIN,
  WIKIBASE_URL_DOMAIN,
  UPDATE_REASONS,
  SECURE_DEVELOPMENT_ORG_UNIT,
  SEVERITY_MAP,
  PRIORITY_MAP,
  THREAT_MODEL_FINDING_TAG,
  SECURITY_FINDING_TAG,
  SLA_IN_DAYS_MAP,
} from "./constant.js";
import { LinkObjectType } from "@gram/core/dist/data/links/Link.js";
import {
  GramActionItemCreatePayload,
  GramActionItemUpdatePayload,
  OrgRelations,
  SuccessDashboardActionItemExporterOptions,
  SuccessDashboardCreateResult,
  SuccessDashboardUpdateResult,
} from "./types.js";
import Model from "@gram/core/dist/data/models/Model.js";
import { Review } from "@gram/core/dist/data/reviews/Review.js";

const log = log4js.getLogger("SuccessDashboardActionItemExporter");

export class SuccessDashboardActionItemExporter implements ActionItemExporter {
  readonly key = "success-dashboard";
  exportOnReviewApproved: boolean;
  successDashboardClient: SuccessDashboardApiClient;
  gramBaseUrl: string | undefined;
  private readonly modelByIdCache = new Map<string, Model | null>();
  private readonly modelReviewByModelIdCache = new Map<string, Review | null>();
  private readonly accountableTeamBySystemIdCache = new Map<
    string,
    { externalId: string; name: string } | null
  >();
  /** Threat id → Success Dashboard ticket UUID for tickets that need updating. */
  private readonly threatToTicketIdMap = new Map<string, string>();
  wikibaseClient: WikibaseSdkClient;

  constructor(
    private readonly dal: DataAccessLayer,
    private readonly options: SuccessDashboardActionItemExporterOptions = {}
  ) {
    this.exportOnReviewApproved = this.options.exportOnReviewApproved ?? true;
    this.gramBaseUrl = this.options.gramBaseUrl ?? "";
    this.successDashboardClient = new SuccessDashboardApiClient({
      baseUrl: this.options.successDashboardUrl,
      apiToken: this.options.successDashboardapiToken,
    });
    this.wikibaseClient = new WikibaseSdkClient();
  }

  async export(_dal: DataAccessLayer, actionItems: Threat[]): Promise<void> {
    this.modelByIdCache.clear();
    this.modelReviewByModelIdCache.clear();
    this.accountableTeamBySystemIdCache.clear();
    this.threatToTicketIdMap.clear();

    await Promise.all(
      actionItems.map(async (item) => {
        // Check if the action item is eligible for export
        const { skipReasons, updateReasons } =
          await this.assertExportIsEligible(item);

        if (skipReasons.length > 0) {
          log.info(
            `Skipping action item creation for threat ${
              item.id
            } for the following reasons: ${skipReasons.join(", ")}`
          );
          return;
        }
        if (updateReasons.length > 0) {
          log.info(
            `Updating action item ${
              item.id
            } for the following reasons: ${updateReasons.join(", ")}`
          );
          const ticketId = item.id
            ? this.threatToTicketIdMap.get(item.id)
            : undefined;
          await this.updateExport(ticketId ?? "", item);
          return;
        }
        log.info(`Creating action item ${item.id}`);
        // Create the action item in Success Dashboard
        const createdTicketId = await this.createExport(item);
        if (createdTicketId.success) {
          // Insert as a link
          await this.dal.linkService.insertLink(
            LinkObjectType.Threat,
            item.id!,
            createdTicketId.id.split("-")[0],
            `https://${SUCCESS_DASHBOARD_URL_DOMAIN}/${createdTicketId.id}`,
            "",
            this.key
          );
        } else {
          log.error(
            `Error creating action item ${item.id}: ${createdTicketId.error}`
          );
          return;
        }
      })
    );
  }

  /* Check if the action item is eligible for export */
  private async assertExportIsEligible(
    threat: Threat
  ): Promise<{ skipReasons: string[]; updateReasons: string[] }> {
    const skipReasons: string[] = [];
    const updateReasons: string[] = []; // Useful if we want to update the ticket if it is in treatment

    // Check  model and system ID
    if (!threat.modelId?.trim()) {
      skipReasons.push(SKIP_REASONS.NO_MODEL_ID);
    } else {
      const model = await this.getActionItemModel(threat);
      if (!model) {
        skipReasons.push(SKIP_REASONS.NO_MODEL_ID);
      }
      if (!model?.systemId?.trim()) {
        skipReasons.push(SKIP_REASONS.NO_SYSTEM_ID);
      }
    }

    // Check if the action item has already been exported
    // Check if threat has a link to Success Dashboard or Wikibase, and if the ticket is not completed or rejected
    const links = await this.dal.linkService.listLinks(
      LinkObjectType.Threat,
      threat.id!
    );

    const successDashboardLinks = links.filter(
      (link) =>
        link.createdBy === this.key ||
        link.url.includes(SUCCESS_DASHBOARD_URL_DOMAIN) ||
        link.url.includes(WIKIBASE_URL_DOMAIN)
    );
    if (successDashboardLinks.length > 0) {
      for (const link of successDashboardLinks) {
        const id = link.url.match(
          /Q\d+$|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
        )?.[0];
        log.debug(`ID ${id} extracted from URL: ${link.url}`);

        if (!id) {
          continue;
        }
        const ticket = id.startsWith("Q")
          ? await this.successDashboardClient.getTicketByQid(id)
          : await this.successDashboardClient.getTicketById(id);
        log.debug(`Ticket ${id} status: ${ticket.statusId}`);

        if (["completed", "rejected"].includes(ticket.statusId)) {
          log.debug(
            `Ticket ${id} is ${ticket.statusId}, creating a new ticket and removing the old link`
          );
          await this.dal.linkService.deleteLink(link.id);
          // Check if the threat severity is low or informative, now that the ticket link is deleted
          if (!threat.severity || LOW_SEVERITIES.includes(threat.severity)) {
            skipReasons.push(SKIP_REASONS.SEVERITY_LOW);
          }
          continue;
        } else {
          log.debug(
            `Ticket ${id} is ${ticket.statusId}, updating the existing ticket`
          );
          updateReasons.push(UPDATE_REASONS.EXPORTED_BUT_IN_TREATMENT);
          if (threat.id) {
            this.threatToTicketIdMap.set(threat.id, ticket.id);
          }
          continue;
        }
      }
    } else {
      // Check severity
      if (!threat.severity || LOW_SEVERITIES.includes(threat.severity)) {
        skipReasons.push(SKIP_REASONS.SEVERITY_LOW);
      }
    }

    return { skipReasons, updateReasons };
  }

  /** Change threat into create payload and create the action item in Success Dashboard. */
  private async createExport(
    threat: Threat
  ): Promise<SuccessDashboardCreateResult> {
    const createBody = await this.toCreateBody(threat);
    return await this.successDashboardClient.createExport(createBody);
  }

  /** Change threat into update payload and update the action item in Success Dashboard. */
  private async updateExport(
    exportId: string,
    threat: Threat
  ): Promise<SuccessDashboardUpdateResult> {
    if (
      threat.severity &&
      [ThreatSeverity.Low, ThreatSeverity.Informative].includes(threat.severity)
    ) {
      return await this.successDashboardClient.updateExport(exportId, {
        statusId: "rejected",
        statusDescription:
          "Change of severity to low or informative. Low severity action items should not be exported to Success Dashboard.",
      });
    }
    const updateBody = await this.toUpdateBody(threat);
    return await this.successDashboardClient.updateExport(exportId, updateBody);
  }

  // Format the payload for Success Dashboard API

  private async toCreateBody(
    threat: Threat
  ): Promise<GramActionItemCreatePayload> {
    const body: GramActionItemCreatePayload = {
      title: threat.title,
      typeId: "actionable_improvement",
      statusId: "backlog",
      statusDescription:
        "Action item is exported in backlog. Please review, update this ticket as needed. When you start the mitigation, update the status to in_progress.",
      description: await this.buildDescription(threat),
      observedIssue: this.buildObservedIssue(threat),
      suggestedSolution: await this.buildSuggestedSolution(threat),
      dueDate: this.buildDueDate(threat),
      estimatedEffort: 1,
      tagIds: [THREAT_MODEL_FINDING_TAG, SECURITY_FINDING_TAG],
    };
    const mainSystem = await this.buildMainSystem(threat);
    if (mainSystem) {
      body.mainSystem = mainSystem;
    }
    const severity = this.buildSeverity(threat);
    if (severity) {
      body.severity = severity;
    }

    const priority = this.buildPriority(threat);
    if (priority) {
      body.priority = priority;
    }

    const orgRelations = await this.buildOrgRelation(threat);
    if (orgRelations.length > 0) {
      body.orgRelations = orgRelations;
    }

    const url = this.buildGramModelUrl(threat);
    if (url) {
      body.url = url;
      body.attributes = {
        observed_issue_url: url,
      };
    }

    return body;
  }

  private async toUpdateBody(
    threat: Threat
  ): Promise<GramActionItemUpdatePayload> {
    const gramModelUrl = this.buildGramModelUrl(threat);
    const body: GramActionItemUpdatePayload = {
      title: threat.title,
      description: await this.buildDescription(threat),
      observedIssue: this.buildObservedIssue(threat),
      suggestedSolution: await this.buildSuggestedSolution(threat),
      dueDate: this.buildDueDate(threat),
      priority: this.buildPriority(threat),
      orgRelations: await this.buildOrgRelation(threat),
      statusDescription:
        "Action item is exported in backlog. Please review, update this ticket as needed. When you start the mitigation, update the status to in_progress.",
    };

    const severity = this.buildSeverity(threat);
    if (severity) {
      body.severity = severity;
    }

    if (gramModelUrl) {
      body.url = gramModelUrl;
      body.attributes = {
        observed_issue_url: gramModelUrl,
      };
    }
    return body;
  }

  // Helper methods for getting metadata about the action item and cache results
  private async getActionItemModel(threat: Threat): Promise<Model | null> {
    const modelId = threat.modelId?.trim();
    if (!modelId) {
      return null;
    }
    if (this.modelByIdCache.has(modelId)) {
      return this.modelByIdCache.get(modelId) ?? null;
    }
    const model = await this.dal.modelService.getById(modelId);
    this.modelByIdCache.set(modelId, model);
    return model;
  }

  private async getActionItemModelReview(
    threat: Threat
  ): Promise<Review | null> {
    const modelId = threat.modelId?.trim();
    if (!modelId) {
      return null;
    }
    if (this.modelReviewByModelIdCache.has(modelId)) {
      return this.modelReviewByModelIdCache.get(modelId) ?? null;
    }
    const review = await this.dal.reviewService.getByModelId(modelId);
    this.modelReviewByModelIdCache.set(modelId, review);
    return review;
  }

  private async getActionItemAccountableTeam(
    model: Model
  ): Promise<{ externalId: string; name: string } | null> {
    const systemId = model?.systemId?.trim();
    if (!systemId) {
      return null;
    }
    if (this.accountableTeamBySystemIdCache.has(systemId)) {
      return this.accountableTeamBySystemIdCache.get(systemId) ?? null;
    }
    const system = await this.dal.systemProvider.getSystem({}, systemId);
    let accountableTeam: { externalId: string; name: string } | null = null;
    if (system) {
      const team = system.owners[0].name;
      const teamQID = await this.wikibaseClient.getOrgUnitQID(team);
      if (teamQID) {
        accountableTeam = { externalId: teamQID, name: team };
      }
    }
    this.accountableTeamBySystemIdCache.set(systemId, accountableTeam);
    return accountableTeam;
  }

  // Helper methods for formatting the fields of the payload for Success Dashboard API

  private buildPriority(
    threat: Threat
  ): GramActionItemCreatePayload["priority"] {
    const priorityMap = PRIORITY_MAP as Record<
      ThreatSeverity,
      GramActionItemCreatePayload["priority"]
    >;
    if (!threat.severity) {
      return undefined;
    }
    return priorityMap[threat.severity];
  }

  private buildDueDate(threat: Threat): string {
    const severity = threat.severity ?? ThreatSeverity.Medium;
    const slaDays = SLA_IN_DAYS_MAP[severity] ?? 180;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + slaDays);
    return dueDate.toISOString();
  }

  private buildSeverity(
    threat: Threat
  ): GramActionItemCreatePayload["severity"] | "" {
    const severityMap = SEVERITY_MAP as Record<
      ThreatSeverity,
      GramActionItemCreatePayload["severity"]
    >;
    if (!threat.severity) {
      return "";
    }
    return severityMap[threat.severity];
  }

  private buildGramModelUrl(threat: Threat): string | undefined {
    if (!this.gramBaseUrl) return undefined;
    const base = this.gramBaseUrl.replace(/\/$/, "");
    return `${base}/model/${threat.modelId}`;
  }

  private buildObservedIssue(threat: Threat): string {
    if (threat.description?.trim()) {
      return `${threat.title.trim()}: ${threat.description.trim()}`;
    }
    return `Ask reporting contributor for more details about the observed issue: ${threat.title.trim()}`;
  }

  private async buildOrgRelation(threat: Threat): Promise<OrgRelations> {
    let orgRelation: OrgRelations = [];

    // Add reporting team relation
    orgRelation.push({
      relation: "reporting_team",
      orgUnit: {
        externalId: SECURE_DEVELOPMENT_ORG_UNIT,
        name: "Secure Development",
      },
    });

    // Add reporting contributor relation
    const review = await this.getActionItemModelReview(threat);
    if (review && review.reviewedBy) {
      const contributor =
        await this.successDashboardClient.getContributorByEmail(
          review.reviewedBy
        );
      if (contributor) {
        orgRelation.push({
          relation: "reporting_contributor",
          user: {
            externalId: contributor.id,
            name: contributor.contributorName,
          },
        });
      }
    }

    // Add accountable team relation
    const model = await this.getActionItemModel(threat);
    if (model) {
      const accountableTeam = await this.getActionItemAccountableTeam(model);
      if (accountableTeam) {
        orgRelation.push({
          relation: "accountable_team",
          orgUnit: {
            externalId: accountableTeam.externalId,
            name: accountableTeam.name,
          },
        });
      }
    }

    return orgRelation;
  }

  private async buildMainSystem(threat: Threat): Promise<string> {
    const model = await this.getActionItemModel(threat);
    if (!model) {
      return "";
    }
    if (!model.systemId?.trim()) {
      return "";
    }
    try {
      const systemQID = await this.wikibaseClient.getSystemQID(model.systemId);
      if (!systemQID) {
        return "";
      }
      return systemQID;
    } catch (error) {
      log.error(
        `Error getting system QID for system ${model.systemId}: ${error}`
      );
      return "";
    }
  }

  private async buildSuggestedSolution(threat: Threat): Promise<string> {
    const controls = await this.dal.controlService.listByThreatId(threat.id!);
    if (controls.length > 0) {
      const suggestedSolutionText = controls
        .map(
          (control, idx) =>
            `Control #${idx + 1} (${
              control.inPlace ? "In place" : "Not in place"
            }): ${control.title} - ${
              control.description
                ? control.description
                : "Please contact the reporter contributor for more information."
            }`
        )
        .join("; ");

      return suggestedSolutionText;
    } else {
      return "No suggested solutions available. Please contact the reporting contributor for more information.";
    }
  }

  private async buildDescription(threat: Threat): Promise<string> {
    const model = await this.getActionItemModel(threat);
    if (!model) {
      return "Ask reporting contributor for more details";
    }
    const component = model.data.components.find(
      (c) => c.id === threat.componentId
    );

    if (component) {
      return `Threat of "${threat.title}" on ${component.name}`;
    } else {
      return `Threat of "${threat.title}"`;
    }
  }
}
