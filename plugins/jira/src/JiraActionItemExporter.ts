import { ActionItemExporter } from "@gram/core/dist/action-items/ActionItemExporter.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Link, LinkObjectType } from "@gram/core/dist/data/links/Link.js";
import Threat from "@gram/core/dist/data/threats/Threat.js";
import log4js from "log4js";
import fetch from "node-fetch";
import { JiraConfig } from "./JiraConfig.js";
import { createHttpsProxyAgent } from "@gram/core/dist/util/proxyAgent.js";
import { Agent } from "https";

const log = log4js.getLogger("JiraActionItemExporter");

export interface JiraActionItemExporterConfig extends JiraConfig {
  /**
   * If "reviewer-as-reporter", the reporter will be set to the user that created the review.' Ensure that the token user has the global permission:
   * `Browse users and groups`.
   * If "jira-token-user", the reporter will always be set to the user that the Jira API token belongs to.
   */
  reporterMode: "reviewer-as-reporter" | "jira-token-user";

  /**
   * If true, action items will be exported when the review is approved.
   */
  exportOnReviewApproved: boolean;

  /**
   * Translates the action item in Gram to the correct fields in your Jira project for
   * when an action item is being exported to a new issue. This function should return
   * the fields that are required to create or update an issue in Jira based on the action item.
   *
   * @param dal
   * @param actionItem
   * @returns
   */
  issueFieldsTranslator: (
    dal: DataAccessLayer,
    actionItem: Threat,
    existingIssue?: string
  ) => Promise<JiraIssueFields>;

  /**
   * Transition to perform when updating an existing issue. If not set, no transition will be performed.
   * Jira requires that you use a transition when updating an issue, so you must set this if you want to update issues
   * to a different status.
   *
   * Should be the transition id, e.g. "21"
   */
  transitionOnUpdateExistingIssue?: string;
}

export interface JiraIssueFields {
  /**
   * The project the issue should be created in.
   */
  project: {
    id: string;
  };
  /**
   * The issue type.
   */
  issuetype: {
    id: string;
  };
  /**
   * Who the issue is reported by
   */
  reporter?: {
    // Jira account id
    id: string;
  };
  /**
   * Who the issue is assigned to
   */
  assignee?: {
    // Jira account id
    id: string;
  };
  /**
   * The summary/title of the issue.
   */
  summary?: string;
  /**
   * The description of the issue.
   */
  description: { type: string; version: number; content: any[] };

  // Any other fields
  [name: string]: any;
}

export class JiraActionItemExporter implements ActionItemExporter {
  key: string = "jira";
  exportOnReviewApproved: boolean;
  agent?: Agent;

  constructor(
    private config: JiraActionItemExporterConfig,
    private dal: DataAccessLayer
  ) {
    this.exportOnReviewApproved = config.exportOnReviewApproved;
    this.agent = createHttpsProxyAgent();
  }

  async export(dal: DataAccessLayer, actionItems: Threat[]): Promise<void> {
    await Promise.all(
      actionItems.map(async (actionItem) => {
        // Will be slow if there are many action items as each one will do a select query
        const links = await dal.linkService.listLinks(
          LinkObjectType.Threat,
          actionItem.id!
        );

        const existingLinks = links.filter((e) => e.createdBy === this.key);
        if (existingLinks.length > 0) {
          // Already exported
          log.info(
            `Action item ${actionItem.id} is already exported to one or more tickets. Updating...`
          );
          await this.updateIssues(existingLinks, actionItem);
          return;
        }

        // Create the issue in Jira
        const issue = await this.createIssue(actionItem);

        // Insert as a link
        await dal.linkService.insertLink(
          LinkObjectType.Threat,
          actionItem.id!,
          issue.key,
          this.config.host + "/browse/" + issue.key,
          this.key,
          this.key
        );
      })
    );
  }

  host() {
    return this.config.host.startsWith("http")
      ? this.config.host
      : "https://" + this.config.host;
  }

  async getReporter(actionItem: Threat) {
    const user = await this.config.auth.user.getValue();

    if (!user) {
      throw new Error("No user configured");
    }

    if (this.config.reporterMode === "jira-token-user") {
      return { id: await this.getAccountIdCurrentUser() };
    }

    const review = await this.dal.reviewService.getByModelId(
      actionItem.modelId
    );

    if (!review) {
      // Fall back to token user if no reviewer is assigned
      log.info(
        `Could not find review for model ${actionItem.modelId}, using token user as reporter`
      );
      return { id: await this.getAccountIdCurrentUser() };
    }

    const reporterId = await this.getAccountIdForEmail(review.reviewedBy);

    if (!reporterId) {
      // Fall back to token user if reviewer cannot be found in Jira
      log.info(
        `Could not find account id for reviewer ${review.reviewedBy}, using token user as reporter`
      );
      return { id: await this.getAccountIdCurrentUser() };
    }

    return { id: reporterId };
  }

  async updateIssues(existingLinks: Link[], actionItem: Threat) {
    await Promise.all(
      existingLinks.map(async (link) => {
        await this.updateIssue(link, actionItem);
      })
    );
  }

  async updateIssue(existingLink: Link, actionItem: Threat) {
    const issueId = existingLink.label;

    // Ensure issueId is a Jira ticket format (i.e. ABC-123)
    // It can be set by the user, so we need to validate it
    if (!issueId.match(/[A-Z]+-\d+/)) {
      throw new Error(`Invalid issue id: ${issueId}`);
    }

    const fields = await this.config.issueFieldsTranslator(
      this.dal,
      actionItem,
      issueId
    );

    const user = await this.config.auth.user.getValue();
    const token = await this.config.auth.apiToken.getValue();
    const resp = await fetch(`${this.host()}/rest/api/3/issue/${issueId}`, {
      method: "PUT",
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
      agent: this.agent,
    });

    if (resp.status !== 204) {
      throw new Error(
        `Failed to update issue for action item ${
          actionItem.id
        }: ${await resp.text()}`
      );
    }

    if (this.config.transitionOnUpdateExistingIssue) {
      const transitionResp = await fetch(
        `${this.host()}/rest/api/3/issue/${issueId}/transitions`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${user}:${token}`).toString(
              "base64"
            )}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transition: { id: this.config.transitionOnUpdateExistingIssue },
          }),
          agent: this.agent,
        }
      );
      if (transitionResp.status !== 204) {
        log.info(
          `Failed to transition updated issue for action item ${actionItem.id}, but this is probably fine. ${transitionResp.status}`
        );
      }
    }

    log.info(`Updated issue ${issueId} for action item ${actionItem.id}`);
  }

  async createIssue(actionItem: Threat) {
    // console.log(JSON.stringify(await this.getFields()));
    // writeFileSync(
    //   "fields.json",
    //   JSON.stringify(await this.getFields(), null, 4)
    // );

    const fields = await this.config.issueFieldsTranslator(
      this.dal,
      actionItem
    );

    if (!fields.reporter) {
      fields.reporter = await this.getReporter(actionItem);
    }

    if (!fields.description) {
      fields.description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: actionItem.description || "(no description)",
              },
            ],
          },
        ],
      };
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
      agent: this.agent,
    });

    const data = (await resp.json()) as any;

    if (resp.status !== 201) {
      throw new Error(
        `Failed to create issue for action item ${
          actionItem.id
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
      agent: this.agent,
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
        agent: this.agent,
      }
    );

    const data = (await resp.json()) as any;

    if (resp.status !== 200 || data.length === 0) {
      log.warn(
        `Failed to get account id for email ${email}: ${JSON.stringify(data)}`
      );
      return null;
    }

    if (data.length > 1) {
      throw new Error(`Multiple accounts found for email ${email}`);
    }

    return data[0].accountId;
  }
}
