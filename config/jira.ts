import { EnvSecret } from "@gram/core/dist/config/EnvSecret.js";
import { GramConfiguration } from "@gram/core/dist/config/GramConfiguration.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { ThreatSeverity } from "@gram/core/dist/data/threats/Threat.js";
import {
  JiraActionItemExporter,
  JiraActionItemExporterConfig,
} from "@gram/jira/dist/JiraActionItemExporter.js";

// {customfield_10063: {id: "12354", value: "Low"}}} {customfield_10063: {id: "12356", value: "High"}} 12357 Critical 12355 Medium 12353 Informative
function severityToJiraSeverity(severity?: ThreatSeverity) {
  switch (severity) {
    case ThreatSeverity.Low:
      return { id: "12354", value: "Low" };
    case ThreatSeverity.Medium:
      return { id: "12355", value: "Medium" };
    case ThreatSeverity.High:
      return { id: "12356", value: "High" };
    case ThreatSeverity.Critical:
      return { id: "12357", value: "Critical" };
    case ThreatSeverity.Informative:
      return { id: "12353", value: "Informative" };
    default:
      return { id: "12354", value: "Low" };
  }
}

export function createStagingJiraActionItemExporter(
  config: GramConfiguration,
  dal: DataAccessLayer
) {
  if (!process.env.JIRA_HOST) {
    throw new Error("JIRA_HOST is not set");
  }

  const jiraActionItemExporterConfig: JiraActionItemExporterConfig = {
    exportOnReviewApproved: true,
    auth: {
      user: new EnvSecret("JIRA_USER"),
      apiToken: new EnvSecret("JIRA_API_TOKEN"),
    },
    reporterMode: "reviewer-as-reporter",
    host: process.env.JIRA_HOST,
    modelToIssueFields: async (dal, actionItem) => {
      const controls = await dal.controlService.list(actionItem.modelId);
      const model = await dal.modelService.getById(actionItem.modelId);
      const componentName =
        model?.data.components.find((c) => c.id === actionItem.componentId)
          ?.name || "unknown component";

      const controlsList = controls.map((control) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text:
                  control.title +
                  (control.description ? " - " + control.description : ""),
              },
            ],
          },
        ],
      }));

      return {
        project: {
          id: "11717",
        },

        issuetype: {
          id: "10001",
        },

        summary: actionItem.title,

        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: `Threat of "${actionItem.title}" on ${componentName}`,
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: actionItem.description || "(no description)",
                },
              ],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "The following controls were suggested as ways to mitigate the threat:",
                },
              ],
            },
            {
              type: "bulletList",
              content: controlsList,
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Once you have implemented enough of the suggested controls enough that it mitigates or fixes this threat, you can move this threat to the mitigated status.",
                },
              ],
            },
          ],
        },

        customfield_11749: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: config.origin + "/model/" + actionItem.modelId,
                },
              ],
            },
          ],
        },

        // Severity
        customfield_10063: severityToJiraSeverity(actionItem.severity),

        customfield_10118: model?.systemId
          ? [{ key: "Demo Service" || model?.systemId }]
          : [],
      };
    },
  };
  const jiraActionItemExporter = new JiraActionItemExporter(
    jiraActionItemExporterConfig,
    dal
  );
  return jiraActionItemExporter;
}
