import { EnvSecret } from "@gram/core/dist/config/EnvSecret.js";
import { GramConfiguration } from "@gram/core/dist/config/GramConfiguration.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { ThreatSeverity } from "@gram/core/dist/data/threats/Threat.js";
import {
  JiraActionItemExporter,
  JiraActionItemExporterConfig,
  JiraIssueFields,
} from "@gram/jira/dist/JiraActionItemExporter.js";
import log4js from "log4js";

const log = log4js.getLogger("jira");

function severityToStagJiraSeverity(severity?: ThreatSeverity) {
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

function severityToProdJiraSeverity(severity?: ThreatSeverity) {
  switch (severity) {
    case ThreatSeverity.Low:
      return { id: "13314", value: "Low" };
    case ThreatSeverity.Medium:
      return { id: "13313", value: "Medium" };
    case ThreatSeverity.High:
      return { id: "13312", value: "High" };
    case ThreatSeverity.Critical:
      return { id: "13311", value: "Critical" };
    case ThreatSeverity.Informative:
      return { id: "13315", value: "Informative" };
    default:
      return { id: "13314", value: "Low" };
  }
}

export function createJiraActionItemExporter(
  config: GramConfiguration,
  dal: DataAccessLayer,
  jiraEnvironment: "sandbox" | "production" = "sandbox"
) {
  const jiraActionItemExporterConfig: JiraActionItemExporterConfig = {
    exportOnReviewApproved: true,

    auth: {
      user: new EnvSecret("JIRA_USER"),
      apiToken: new EnvSecret("JIRA_API_TOKEN"),
    },

    reporterMode: "reviewer-as-reporter",

    host:
      jiraEnvironment == "sandbox"
        ? "https://klarna-sandbox-343.atlassian.net"
        : "https://klarna.atlassian.net",

    modelToIssueFields: async (dal, actionItem) => {
      const controls = await dal.controlService.list(actionItem.modelId);
      const mitigations = await dal.mitigationService.list(actionItem.modelId);
      const model = await dal.modelService.getById(actionItem.modelId);
      const componentName =
        model?.data.components.find((c) => c.id === actionItem.componentId)
          ?.name || "unknown component";

      const mitigationsForThreat = new Set(
        mitigations
          .filter((m) => m.threatId === actionItem.id)
          .map((m) => m.controlId)
      );

      const controlsList = controls
        .filter((control) => mitigationsForThreat.has(control.id!))
        .map((control) => ({
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

      let fields: Partial<JiraIssueFields> = {
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
      };

      if (jiraEnvironment === "sandbox") {
        fields["project"] = {
          id: "11717",
        };

        fields["issuetype"] = {
          id: "10001",
        };

        fields["customfield_11749"] = {
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
        };

        // Severity
        fields["customfield_10063"] = severityToStagJiraSeverity(
          actionItem.severity
        );

        fields["customfield_11524"] = model?.systemId;
      } else if (jiraEnvironment === "production") {
        fields["project"] = {
          id: "12056",
        };

        fields["issuetype"] = {
          id: "10002",
        };

        fields["customfield_11727"] = {
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
        };

        // Severity
        fields["customfield_10043"] = severityToProdJiraSeverity(
          actionItem.severity
        );

        fields["customfield_10311"] = model?.systemId;
      }

      log.debug("creating jira issue with fields: ", fields);

      return fields as JiraIssueFields;
    },
  };

  const jiraActionItemExporter = new JiraActionItemExporter(
    jiraActionItemExporterConfig,
    dal
  );
  return jiraActionItemExporter;
}
