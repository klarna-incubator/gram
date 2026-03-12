import WBEdit from "wikibase-edit";
import { GeneralConfig } from "wikibase-edit";
import log4js from "log4js";
import { ThreatModelFinding } from "./WikibaseActionItemExporter.js";

import { EntityId, Guid, PropertyId } from "wikibase-sdk";
import { WikibaseSdkClient } from "./WikibaseSdkClient.js";

const log = log4js.getLogger("WikibasEditClient");

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
  wbSdk: WikibaseSdkClient;

  constructor(private wikibaseSdkClient: WikibaseSdkClient) {
    this.wbEdit = WBEdit(this.config);
    this.wbSdk = this.wikibaseSdkClient;
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
      log.info("Entity created in Wikibase:", { entity });
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
      log.warn("Error creating item:", error);
      throw error;
    }
  }

  async editQualifier(
    itemId: EntityId,
    propertyId: PropertyId,
    qualifierId: PropertyId,
    value: string,
    replaceValue: boolean = true,
  ) {
    try {
      const claim = await this.wbSdk.getClaimData(itemId, propertyId);

      if (!claim?.id) {
        log.warn(
          `Claim GUID not found for item QID: ${itemId} and property ID: ${propertyId}`,
        );
        return;
      }

      if (replaceValue && claim?.qualifiers && claim.qualifiers[qualifierId]) {
        await Promise.all(
          claim.qualifiers[qualifierId].map(async (el: any) => {
            await this.wbEdit.qualifier.remove({
              guid: claim.id,
              hash: el.hash,
            });
          }),
        );
      }

      await this.wbEdit.qualifier.set({
        guid: claim.id,
        property: qualifierId,
        value: value,
      });

      log.debug(
        `Qualifier updated for item QID: ${itemId} and property ID: ${propertyId}`,
      );
    } catch (error) {
      log.warn("Error editing qualifier:", error);
      throw error;
    }
  }
}
