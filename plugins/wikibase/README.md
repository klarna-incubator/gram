# Wikibase plugin

Plugin for Wikibase related integrations.

## Environment Variables Required

To use this plugin, you must set the following environment variables in your `.env` file:

- `WIKIBASE_USERNAME`: The username for authenticating with the Wikibase instance.
- `WIKIBASE_PASSWORD`: The password for authenticating with the Wikibase instance.

These credentials are required for editing and creating items in Wikibase. Create your personal credential at [Special:BotPasswords](https://wiki.klarna.net/wiki/Special:BotPasswords) page on the Wiki.

For production, please request a system bot.

## Main Files and Functions

### [WikibaseConstants.ts](./src/WikibaseConstants.ts)

Defines constants and types for Wikibase integration, including property and qualifier IDs, entity IDs, and type definitions for instance lists, reporter teams, and priority levels. Used throughout the plugin for consistent mapping to Wikibase concepts.

### [WikibaseActionItemExporter.ts](./src/WikibaseActionItemExporter.ts)

Implements the core logic for exporting action items (threats) from Gram into Wikibase as Threat Model Findings.

- **ThreatModelFinding (class):**

  - Represents a Wikibase item for a threat model finding, with fields for accountable teams, reporter, priority, related system, and more.
  - Provides `toJSON()` for Wikibase item creation and `getQualifiers()` for adding qualifiers to claims.

- **WikibaseActionItemExporter (class, implements ActionItemExporter):**
  - Main exporter class. Converts Gram action items to Wikibase findings, checks for existing items, creates or updates findings, and manages export logic.
  - Key methods:
    - `convertActionItemToFinding`: Maps a Gram threat to a Wikibase finding, resolving system/accountable team, reporter, and priority.
    - `checkIfItemExists`: Checks if a Wikibase item already exists for a given threat.
    - `updateThreatModelFinding`: Updates an existing Wikibase item.
    - `createThreatModelFinding`: Creates a new Wikibase item if none exists, or updates if found.
    - `export`: Main entry point; exports a list of action items, skipping low/informative severity, and links to existing items if present.

### [WikibaseEditClient.ts](./src/WikibaseEditClient.ts)

Handles direct editing and creation of items in Wikibase using the `wikibase-edit` library.

- **generalConfig:** Configuration object for Wikibase instance, credentials, and edit options.
- **WikibaseEditClient (class):**
  - Wraps the `wikibase-edit` API for authenticated editing.
  - Methods:
    - `editItem(finding)`: Edits an existing Wikibase item using data from a `ThreatModelFinding`.
    - `createItem(finding)`: Creates a new Wikibase item, with error handling and support for qualifiers.

### [WikibaseSdkClient.ts](./src/WikibaseSdkClient.ts)

Provides SDK-level access to Wikibase, including entity search, SPARQL queries, and claim simplification.

- **WikibaseSdkClient (class):**
  - Wraps the `wikibase-sdk` library for querying and searching Wikibase entities.
  - Key methods:
    - `getItemDetails(itemQID, properties)`: Fetches and simplifies claims for a Wikibase entity, optionally filtering by property.
    - `getUserQIDFromEmail(email)`: Uses SPARQL to find a user entity by email address.
    - `getItemQID(itemLabel)`: Searches for an entity by label and returns its QID.
    - `getUserQID(itemLabel)`: Searches for a user entity by label.
    - `getSystemQID(systemId)`: Searches for a system entity by name, filtering for those labeled as systems.
    - `getOrgUnitQID(systemName)`: Searches for an org unit entity by name, filtering for those labeled as org units.

For further details, see the source files in `src/`. The exporter coordinates the conversion and transfer of Gram action items into Wikibase, using the SDK and edit clients for querying and writing data.
