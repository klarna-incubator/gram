import {
  PROPERTIES,
  INSTANCE_OF_LIST,
  BACKLOG,
  InstanceOfListType,
  REPORTER_TEAM_TYPE,
  PRIORITY_TYPE,
  SECURE_DEVELOPMENT_ORG_UNIT,
  QUALIFIERS,
} from "./WikibaseConstants.js";
import { WikibaseEditClient } from "./WikibaseEditClient.js";
import { WikibaseSdkClient } from "./WikibaseSdkClient.js";
import Threat, { ThreatSeverity } from "@gram/core/dist/data/threats/Threat.js";
import { ActionItemExporter } from "@gram/core/dist/action-items/ActionItemExporter.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Link, LinkObjectType } from "@gram/core/dist/data/links/Link.js";
import log4js from "log4js";
import { EntityId, PropertyId } from "wikibase-sdk";
import Model from "@gram/core/dist/data/models/Model.js";
import { Review } from "@gram/core/dist/data/reviews/Review.js";

const log = log4js.getLogger("WikibaseActionItemExporter");

const WIKIBASE_URL_DOMAIN = "knowledgegraph.klarna.net";
const LOW_SEVERITIES: ThreatSeverity[] = [
  ThreatSeverity.Informative,
  ThreatSeverity.Low,
];

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
    public modelId: string,
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
        [PROPERTIES.STATUS]: BACKLOG,
        [PROPERTIES.DUE_DATE]: this.dueDate,
        [PROPERTIES.REPORTED_ESTIMATED_EFFORT]: 1,
      },
    };
  }

  getQualifiers(): Record<PropertyId, Record<PropertyId, EntityId | string>> {
    const qualifiers: Record<
      PropertyId,
      Record<PropertyId, EntityId | string>
    > = {};
    if (this.accountableContributor) {
      qualifiers[PROPERTIES.ACCOUNTABLE] = {
        [QUALIFIERS.CONTRIBUTOR]: this.accountableContributor,
      };
    }
    if (this.reporterContributor) {
      qualifiers[PROPERTIES.REPORTER_TEAM] = {
        [QUALIFIERS.CONTRIBUTOR]: this.reporterContributor,
      };
    }
    if (this.modelId) {
      qualifiers[PROPERTIES.OBSERVED_ISSUE] = {
        [QUALIFIERS.URL]: `https://gram.klarna.net/model/${this.modelId}`,
      };
    }
    return qualifiers;
  }
}

export class WikibaseActionItemExporter implements ActionItemExporter {
  // ActionItemExporter
  key: string = "wikibase";
  exportOnReviewApproved: boolean;

  wikibaseClient: WikibaseEditClient = new WikibaseEditClient();
  wikibaseSdkClient: WikibaseSdkClient = new WikibaseSdkClient();
  constructor(
    private dal: DataAccessLayer,
    exportOnReviewApproved: boolean = true,
  ) {
    this.exportOnReviewApproved = exportOnReviewApproved;
  }

  private static readonly SEVERITY_TO_PRIORITY: Record<
    ThreatSeverity,
    PRIORITY_TYPE
  > = {
    [ThreatSeverity.Critical]: 1,
    [ThreatSeverity.High]: 2,
    [ThreatSeverity.Medium]: 3,
    [ThreatSeverity.Low]: 3,
    [ThreatSeverity.Informative]: 3,
  };

  private static readonly SEVERITY_TO_SLA_IN_DAYS: Record<
    ThreatSeverity,
    number
  > = {
    [ThreatSeverity.Critical]: 30,
    [ThreatSeverity.High]: 90,
    [ThreatSeverity.Medium]: 180,
    [ThreatSeverity.Low]: 365,
    [ThreatSeverity.Informative]: 365,
  };

  private static readonly SKIP_REASONS = {
    SEVERITY_LOW: "Low severity action items are not exported",
    ALREADY_EXPORTED: "Action item is already exported to one or more tickets.",
    NO_SYSTEM_ID: "Action item has no system ID.",
  };

  public async export(
    dal: DataAccessLayer,
    actionItems: Threat[],
  ): Promise<void> {
    await Promise.all(
      actionItems.map((item) => this.exportActionItemIfEligible(dal, item)),
    );
  }

  private async exportActionItemIfEligible(
    dal: DataAccessLayer,
    item: Threat,
  ): Promise<void> {
    const skipReasons: (keyof typeof WikibaseActionItemExporter.SKIP_REASONS)[] =
      [];

    this.shouldSkipBySeverity(item, skipReasons);

    await this.shouldSkipIfAlreadyExported(dal, item, skipReasons);

    await this.shouldSkipIfNoSystemId(item, dal, skipReasons);

    if (skipReasons.length > 0) {
      log.info(
        `Skipping action item ${
          item.id
        } for the following reasons: ${skipReasons.join(", ")}`,
      );
      return;
    }

    const exportedItemQID = await this.createThreatModelFinding(dal, item);
    if (exportedItemQID) {
      log.info(
        `Successfully exported action item to Wikibase: ${exportedItemQID}`,
      );
    }

    // Insert as a link
    await dal.linkService.insertLink(
      LinkObjectType.Threat,
      item.id!,
      exportedItemQID,
      `https://knowledgegraph.klarna.net/wiki/Item:${exportedItemQID}`,
      "",
      this.key,
    );
  }

  // Helper methods for exportActionItemIfEligible - Beginning

  private shouldSkipBySeverity(item: Threat, skipReasons: string[]) {
    if (!item.severity || LOW_SEVERITIES.includes(item.severity)) {
      skipReasons.push(WikibaseActionItemExporter.SKIP_REASONS.SEVERITY_LOW);
    }
  }

  private async shouldSkipIfAlreadyExported(
    dal: DataAccessLayer,
    item: Threat,
    skipReasons: string[],
  ) {
    const links = await dal.linkService.listLinks(
      LinkObjectType.Threat,
      item.id!,
    );

    const hasWikibaseLink = links.some(
      (link) =>
        link.createdBy === this.key || link.url.includes(WIKIBASE_URL_DOMAIN),
    );
    if (hasWikibaseLink) {
      skipReasons.push(
        WikibaseActionItemExporter.SKIP_REASONS.ALREADY_EXPORTED,
      );
    }
  }

  private async shouldSkipIfNoSystemId(
    item: Threat,
    dal: DataAccessLayer,
    skipReasons: string[],
  ) {
    if (!item.modelId) {
      skipReasons.push(WikibaseActionItemExporter.SKIP_REASONS.NO_SYSTEM_ID);
    }
    const model = await dal.modelService.getById(item.modelId);
    if (!model) {
      skipReasons.push(WikibaseActionItemExporter.SKIP_REASONS.NO_SYSTEM_ID);
    }
    if (!model?.systemId) {
      skipReasons.push(WikibaseActionItemExporter.SKIP_REASONS.NO_SYSTEM_ID);
    }
  }
  // Helper methods for exportActionItemIfEligible - End

  private async createThreatModelFinding(
    dal: DataAccessLayer,
    actionItem: Threat,
  ): Promise<any> {
    try {
      // Convert action item to Threat Model Finding
      log.debug(`Converting action item to Threat Model Finding...`);
      const finding = await this.convertActionItemToFinding(dal, actionItem);

      log.info(`Creating new Threat Model Finding in Wikibase...`);
      const id = await this.wikibaseClient.createItem(finding);
      log.debug(`Entity created in Wikibase: ${id}`);
      return id;
    } catch (error) {
      log.error(
        `Error converting action item ${actionItem.id} to Threat Model Finding: ${error}`,
      );
      throw error;
    }
  }

  private async convertActionItemToFinding(
    dal: DataAccessLayer,
    actionItem: Threat,
  ): Promise<ThreatModelFinding> {
    const model = await dal.modelService.getById(actionItem.modelId);
    if (!model) {
      throw new Error(`Model not found for action item ${actionItem.id}`);
    }
    if (!model?.systemId) {
      throw new Error(`System ID not found for model ${actionItem.modelId}`);
    }

    const finding = new ThreatModelFinding(
      actionItem.title,
      actionItem.description,
      model.systemId,
      actionItem.modelId,
    );

    this.assignDescription(model, actionItem, finding);

    await this.assignSystem(model, dal, finding);

    if (finding.relatedTo) {
      await this.assignAccountableTeam(finding.relatedTo, finding);
    }

    const review = await dal.reviewService.getByModelId(actionItem.modelId);

    if (review) {
      await this.assignReporterContributor(
        dal,
        actionItem.modelId,
        review,
        finding,
      );
    }

    await this.assignReporterTeam(dal, review?.reviewedBy, finding);

    this.assignPriorityRank(actionItem, finding);

    this.assignDueDate(actionItem, finding);

    this.assignEstimatedEffort(actionItem, finding);

    await this.assignSuggestedSolution(dal, actionItem, finding);

    return finding;
  }

  // Helper methods for convertActionItemToFinding - Beginning

  private assignDescription(
    model: Model,
    item: Threat,
    finding: ThreatModelFinding,
  ) {
    const component = model.data.components.find(
      (c) => c.id === item.componentId,
    );

    if (component) {
      finding.description = `Threat of "${item.title}" on ${component.name} - ${item.description}`;
    } else {
      finding.description = `Threat of "${item.title}" - ${item.description}`;
    }
  }

  private async assignSystem(
    model: Model,
    _dal: DataAccessLayer,
    finding: ThreatModelFinding,
  ): Promise<void> {
    const systemQID = await this.wikibaseSdkClient.getSystemQID(
      model.systemId!,
    ); // We know that the model has a system ID because we checked it earlier

    if (!systemQID) {
      log.warn(
        `Could not find system QID for system ID ${model?.systemId}, skipping accountable team assignment.`,
      );
      return;
    }

    finding.relatedTo = systemQID;
  }

  private async assignAccountableTeam(
    systemQID: EntityId,
    finding: ThreatModelFinding,
  ): Promise<void> {
    const systemClaims = await this.wikibaseSdkClient.getItemDetails(
      systemQID,
      [PROPERTIES.ACCOUNTABLE],
    );

    if (!systemClaims?.[PROPERTIES.ACCOUNTABLE]) {
      log.warn(
        `Could not find accountable team QID for system QID ${systemQID}, skipping accountable team assignment.`,
      );
      return;
    }

    finding.accountableTeam = systemClaims[PROPERTIES.ACCOUNTABLE][0];
  }

  private async assignReporterContributor(
    _dal: DataAccessLayer,
    modelId: string,
    review: Review,
    finding: ThreatModelFinding,
  ): Promise<void> {
    const reporterEmail = review.reviewedBy;
    if (!reporterEmail) {
      log.warn(
        `Could not find reporter email for review, skipping reporter contributor assignment.`,
      );
      return;
    }

    const reporterQID = await this.wikibaseSdkClient.getUserQIDFromEmail(
      reporterEmail,
    );

    if (!reporterQID) {
      log.warn(
        `Could not find reporter contributor QID for email ${reporterEmail}, skipping reporter contributor assignment.`,
      );
      return;
    }

    finding.reporterContributor = reporterQID;
  }

  private async assignReporterTeam(
    dal: DataAccessLayer,
    reporterEmail: string | undefined,
    finding: ThreatModelFinding,
  ) {
    //TODO: Implement reporter team assignment
    // For now, we're using the Secure Development org unit
    finding.reporterTeam = SECURE_DEVELOPMENT_ORG_UNIT;
  }

  private assignDueDate(actionItem: Threat, finding: ThreatModelFinding): void {
    const severity = actionItem.severity ?? ThreatSeverity.Medium;
    const slaDays =
      WikibaseActionItemExporter.SEVERITY_TO_SLA_IN_DAYS[severity];
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + slaDays);
    finding.dueDate = dueDate.toISOString().split("T")[0];
  }
  private assignPriorityRank(
    actionItem: Threat,
    finding: ThreatModelFinding,
  ): void {
    finding.priorityRank =
      actionItem.severity != null
        ? WikibaseActionItemExporter.SEVERITY_TO_PRIORITY[actionItem.severity]
        : 3;
  }
  private assignEstimatedEffort(
    actionItem: Threat,
    finding: ThreatModelFinding,
  ): void {
    finding.reporterEstimatedEffort = 1;
  }

  private async assignSuggestedSolution(
    dal: DataAccessLayer,
    actionItem: Threat,
    finding: ThreatModelFinding,
  ): Promise<void> {
    const controls = await dal.controlService.listByThreatId(actionItem.id!);
    if (controls.length === 0) {
      log.warn(
        `No controls for threat ${actionItem.id}, skipping suggested solution assignment.`,
      );
      finding.suggestedSolution =
        "No suggested solutions available. Please contact the reporter contributor for more information.";
    }
    const suggestedSolutionText = controls
      .map(
        (control, idx) =>
          `Control #${idx + 1} (${
            control.inPlace ? "In place" : "Not in place"
          }): ${control.title} - ${control.description}`,
      )
      .join("; ");

    finding.suggestedSolution = suggestedSolutionText;
  }
}
