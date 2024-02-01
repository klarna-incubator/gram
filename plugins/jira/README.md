# Jira

Plugin for Jira related integrations.

Currently includes:

- [JiraActionItemExporter](./src/JiraActionItemExporter.ts) - Used to export action items from Gram into Jira. i.e. Create issues based on action items.

## JiraActionItemExporter Example

Check the Atlassian Developer docs on how to the format of fields works. This
ADF Builder is particularily helpful: https://developer.atlassian.com/cloud/jira/platform/apis/document/playground/

```ts
export function createJiraActionItemExporter(
  config: GramConfiguration,
  dal: DataAccessLayer
) {
  const jiraActionItemExporterConfig: JiraActionItemExporterConfig = {
    /**
     * Automatically trigger an export of all action items to Jira when a review is approved.
     */
    exportOnReviewApproved: true,
    auth: {
      user: new EnvSecret("JIRA_USER"),
      apiToken: new EnvSecret("JIRA_API_TOKEN"),
    },
    reporterMode: "jira-token-user",
    host: "https://<your org>.atlassian.net",

    /**
     * (Required) Translates the action item in Gram to the correct fields in your Jira project.
     */
    modelToIssueFields: async (dal, actionItem) => {
      const controls = await dal.controlService.list(actionItem.modelId);
      const mitigations = await dal.mitigationService.list(actionItem.modelId);
      const model = await dal.modelService.getById(actionItem.modelId);

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

        /**
         * Example of setting a custom field, in this case a reference URL back to Gram.
         */
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

        // Example Severity field
        customfield_10063: severityToJiraSeverity(actionItem.severity),
      };
    },
  };
  const jiraActionItemExporter = new JiraActionItemExporter(
    jiraActionItemExporterConfig,
    dal
  );
  return jiraActionItemExporter;
}

function severityToJiraSeverity(severity?: ThreatSeverity) {
  switch (severity) {
    // Example only, these IDs will differ on your own setup.
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
```
