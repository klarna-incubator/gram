# @gram/success-dashboard

Exports Gram threat-model **action items** to the **Success Dashboard** HTTP API after review approval (when `exportOnReviewApproved` is true) or when triggered through the action-item export flow.

## Configuration

Implementations pass a `SuccessDashboardExporterConfig` object (see `src/SuccessDashboardActionItemExporter.ts`):

| Field | Description |
| --- | --- |
| `baseUrl` | Service base URL, e.g. `https://success-dashboard.example.com` |
| `apiToken` | Optional bearer token (`Authorization: Bearer …`) |
| `exportPath` | Path for each POST; default `/api/v1/gram/action-items` |
| `publicGramBaseUrl` | Optional public Gram URL used to set `gramModelUrl` on payloads |

## API client

`SuccessDashboardApiClient` is constructed with `SuccessDashboardApiClientOptions` (`baseUrl`, optional `exportPath`, `apiToken`, `fetchImpl`). It binds to that HTTP source and exposes:

| Method | HTTP | Path |
| --- | --- | --- |
| `createExport(payload)` | `POST` | `{baseUrl}{exportPath}` |
| `updateExport(exportId, payload)` | `PATCH` | `{baseUrl}{exportPath}/{exportId}` |
| `deleteExport(exportId)` | `DELETE` | `{baseUrl}{exportPath}/{exportId}` |

`exportId` is URL-encoded; use the Success Dashboard record id or `gramThreatId`, depending on your API contract. For programmatic use with validation, prefer **`SuccessDashboardActionItemExporter`** `createExport` / `updateExport` / `deleteExport`; the low-level client is still available for advanced cases.

## Exporter entry points

`SuccessDashboardActionItemExporter` implements `ActionItemExporter.export` (batch create) and also exposes:

- **`createExport(payload)`** — validates `baseUrl`, payload shape (`source`, `title`, `modelId`, `componentId`, `createdBy`), then POSTs.
- **`updateExport(exportId, payload)`** — validates `baseUrl`, non-empty `exportId`, and payload, then PATCHes.
- **`deleteExport(exportId)`** — validates `baseUrl` and non-empty `exportId`, then DELETEs.

If `baseUrl` is missing, `export()` logs and skips; **`createExport` / `updateExport` / `deleteExport` throw** so programmatic callers get a clear error.

### Payload shape

Each action item is sent as JSON (`GramActionItemExportPayload`): `source`, `gramThreatId`, `title`, `description`, `modelId`, `componentId`, `createdBy`, optional `severity`, optional `gramModelUrl`. Adjust the Success Dashboard API or add a gateway if your contract differs.

### Local development

In `config/development.ts`, the exporter is registered when `SUCCESS_DASHBOARD_BASE_URL` is set. See root `.env.example` for variable names.

### Staging / production

Add `@gram/success-dashboard` to `config/package.json` (already linked in the workspace), import `SuccessDashboardActionItemExporter`, and append it to `providers.actionItemExporters` in the appropriate `bootstrapProviders` override (see `config/staging.ts` / `config/production.ts` for the Wikibase/Jira pattern).

## Build

```bash
npm install
npm -w @gram/success-dashboard run build
npm -w @gram/success-dashboard test
```
