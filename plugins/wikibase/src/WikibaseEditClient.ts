import WBEdit from "wikibase-edit";
import { GeneralConfig } from "wikibase-edit";

import { EnvSecret } from "@gram/core/dist/config/EnvSecret.js";
import { ThreatModelFinding } from "./WikibaseActionItemExporter.js";

import { Guid, PropertyId } from "wikibase-sdk";

export const generalConfig: GeneralConfig = {
  // A Wikibase instance is required
  instance: "https://knowledgegraph.klarna.net",

  // Credentials for the instance
  credentials: {
    username: process.env["WIKIBASE_USERNAME"] || "",
    password: process.env["WIKIBASE_PASSWORD"] || "",
  },

  // The instance script path, used to find the API endpoint
  // Default: /w
  wgScriptPath: "/w",

  // Optional
  // See https://meta.wikimedia.org/wiki/Help:Edit_summary
  // Default: empty
  summary:
    "Testing the export of action items from poc-gram-action-item-exporter",

  // See https://www.mediawiki.org/wiki/Manual:Tags
  // Default: on Wikidata [ 'WikibaseJS-edit' ], empty for other Wikibase instances
  //tags: ["Test change for poc-gram-action-item-exporter"],

  // Default: `wikidata-edit/${pkg.version} (https://github.com/maxlath/wikidata-edit)`
  userAgent: "poc-gram-action-item-exporter/v 1.0.0",

  // See https://www.mediawiki.org/wiki/Manual:Bots
  // Default: false
  bot: false,

  // See https://www.mediawiki.org/wiki/Manual:Maxlag_parameter
  // Default: 5
  maxlag: 2,
};

export class WikibaseEditClient {
  config: GeneralConfig = generalConfig;
  wbEdit: ReturnType<typeof WBEdit>;

  constructor() {
    this.wbEdit = WBEdit(this.config);
  }

  async editItem(finding: ThreatModelFinding): Promise<any> {
    const data = finding.toJSON();
    return await this.wbEdit.entity.edit({
      // typescript error is inevitable whether type exist or not.
      // @ts-ignore
      type: "item",
      ...data,
    });
  }
  async createItem(finding: ThreatModelFinding): Promise<any> {
    const data = finding.toJSON();
    try {
      // Create the item in Wikibase
      const { entity } = await this.wbEdit.entity.edit({
        // typescript error is inevitable whether type exist or not.
        // @ts-ignore
        type: "item",
        create: true,
        ...data,
      });
      console.log("Entity created in Wikibase:", { entity });
      const claims = entity.claims;
      if (!claims) {
        throw new Error(
          "No claims returned from Wikibase after item creation.",
        );
      }

      // Prepare list of qualifier objects to send
      const findingQualifiers = finding.getQualifiers();
      const qualifierObjects: Array<{
        guid: Guid;
        property: PropertyId;
        value: string;
      }> = [];

      for (const property of Object.keys(findingQualifiers)) {
        const qualifiersForProperty = findingQualifiers[property as PropertyId];
        // Find all claims for this property
        const claimsForProperty = (claims as any)[property] || [];
        for (const claim of claimsForProperty) {
          const guid = claim.id;
          // qualifiersForProperty is an object: { qualifierProperty: value }
          for (const [qualifierProperty, value] of Object.entries(
            qualifiersForProperty,
          )) {
            qualifierObjects.push({
              guid,
              property: qualifierProperty as PropertyId,
              value,
            });
          }
        }
      }
      // Add the qualifiers in Wikibase
      for (const q of qualifierObjects) {
        await this.wbEdit.qualifier.set(q);
      }

      return entity.id;
    } catch (error) {
      console.log("Error creating item:", error);
      throw error;
    }
  }
}
