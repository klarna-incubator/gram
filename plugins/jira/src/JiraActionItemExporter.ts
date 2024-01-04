import {
  ActionItemExporter,
  ExportResult,
} from "@gram/core/dist/action-items/ActionItemExporter.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { ActionItem } from "@gram/core/dist/data/threats/ActionItem.js";
import { JiraConfig } from "./JiraConfig.js";
import log4js from "log4js";
import fetch from "node-fetch";

const log = log4js.getLogger("JiraActionItemExporter");

export interface JiraActionItemExporterConfig extends JiraConfig {
  reporterMode: "reviewer-as-reporter" | "jira-token-user";

  modelToIssueFields: (
    dal: DataAccessLayer,
    actionItem: ActionItem
  ) => Promise<JiraIssueFields>;
}

export interface JiraIssueFields {
  project: {
    id: string;
  };
  issuetype: {
    id: string;
  };
  reporter?: {
    // Jira account id
    id: string;
  };
  // Assignee
  assignee?: {
    // Jira username
    name: string;
  };
  summary?: string;

  // Any other fields
  [name: string]: any;
}

export class JiraActionItemExporter implements ActionItemExporter {
  key: string = "jira";

  constructor(
    private config: JiraActionItemExporterConfig,
    private dal: DataAccessLayer
  ) {}

  async onReviewApproved(
    dal: DataAccessLayer,
    actionItems: ActionItem[]
  ): Promise<ExportResult[]> {
    return (
      await Promise.all(
        actionItems.map(async (actionItem) => {
          if (actionItem.exports.find((e) => e.exporterKey === this.key)) {
            // Already exported
            log.info(`Action item ${actionItem.threat.id} already exported`);
            return null;
          }

          const issue = await this.createIssue(actionItem);

          return {
            Key: this.key,
            ThreatId: actionItem.threat.id!,
            LinkedURL: issue.self,
          };
        })
      )
    ).filter((r) => r !== null) as ExportResult[];
  }

  host() {
    return this.config.host.startsWith("http")
      ? this.config.host
      : "https://" + this.config.host;
  }

  async getReporter(actionItem: ActionItem) {
    const user = await this.config.auth.user.getValue();

    if (!user) {
      throw new Error("No user configured");
    }

    if (this.config.reporterMode === "jira-token-user") {
      return { id: await this.getAccountIdCurrentUser() };
    } else {
      const review = await this.dal.reviewService.getByModelId(
        actionItem.threat.modelId
      );

      if (!review) {
        throw new Error(
          `Could not find review for model ${actionItem.threat.modelId}`
        );
      }

      return { id: await this.getAccountIdForEmail(review.reviewedBy) };
    }
  }

  async createIssue(actionItem: ActionItem) {
    const fields = await this.config.modelToIssueFields(this.dal, actionItem);

    if (!fields.reporter) {
      fields.reporter = await this.getReporter(actionItem);
    }

    const user = await this.config.auth.user.getValue();
    const token = await this.config.auth.apiToken.getValue();
    const resp = await fetch(`${this.host()}/rest/api/3/issue`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${user}:${token}`).toString(
          "base64"
        )}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fields,
      }),
    });

    const data = (await resp.json()) as any;

    if (resp.status !== 201) {
      throw new Error(
        `Failed to create issue for action item ${
          actionItem.threat.id
        }: ${JSON.stringify(data)}`
      );
    }

    return data;
  }

  async getAccountIdCurrentUser() {
    const user = await this.config.auth.user.getValue();
    const token = await this.config.auth.apiToken.getValue();

    const resp = await fetch(`${this.host()}/rest/api/3/myself`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${user}:${token}`).toString(
          "base64"
        )}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    const data = (await resp.json()) as any;

    if (resp.status !== 200) {
      throw new Error(`Failed to get current user: ${JSON.stringify(data)}`);
    }

    return data.accountId;
  }

  async getAccountIdForEmail(email: string) {
    const user = await this.config.auth.user.getValue();
    const token = await this.config.auth.apiToken.getValue();

    const resp = await fetch(
      `${this.host()}/rest/api/3/user/search?query=${encodeURIComponent(
        email
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${Buffer.from(`${user}:${token}`).toString(
            "base64"
          )}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    const data = (await resp.json()) as any;

    if (resp.status !== 200) {
      throw new Error(
        `Failed to get account id for email ${email}: ${JSON.stringify(data)}`
      );
    }

    if (data.length === 0) {
      throw new Error(`No account found for email ${email}`);
    }

    if (data.length > 1) {
      throw new Error(`Multiple accounts found for email ${email}`);
    }

    return data[0].accountId;
  }
}
