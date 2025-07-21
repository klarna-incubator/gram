import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import { SystemPropertyProvider } from "@gram/core/dist/data/system-property/SystemPropertyProvider.js";
import {
  SystemProperty,
  SystemPropertyValue,
} from "@gram/core/dist/data/system-property/types.js";
import { JupiterOneClientFactory } from "./client.js";
import { sanitizeJ1QueryParam } from "./util.js";

export class JupiterOneSystemPropertyProvider
  implements SystemPropertyProvider
{
  id: string = "jupiterone";
  definitions: SystemProperty[] = [
    {
      id: "system-risk-level", // tag.srb2:system-risk-level -> system-risk-level
      label: "System Risk Level",
      type: "radio",
      values: ["ssf", "esf", "hsf"],
    },
    {
      id: "in-scope-for-evcc", // tag.srb2:in-scope-for-evcc -> in-scope-for-evcc
      label: "EVCC",
      type: "toggle",
    },
    {
      id: "audienceClass",
      label: "Audience Class",
      type: "readonly",
    },
    {
      id: "confidentialityClass",
      label: "Confidentiality Class",
      type: "readonly",
    },
    {
      id: "integrityClass",
      label: "Integrity Class",
      type: "readonly",
    },
    {
      id: "lifecycleState",
      label: "Lifecycle State",
      type: "readonly",
    },
  ];

  // Map of JupiterOne attribute names to the corresponding SystemProperty id
  translatedIds: Map<string, string> = new Map([
    ["tag.srb2:system-risk-level", "system-risk-level"],
    ["tag.srb2:in-scope-for-evcc", "in-scope-for-evcc"],
  ]);
  // Reverse of ^, for looking up JupiterOne attribute names by SystemProperty id
  reverseTranslatedIds: Map<string, string> = new Map([
    ["in-scope-for-evcc", "tag.[srb2:in-scope-for-evcc]"],
    ["system-risk-level", "tag.[srb2:system-risk-level]"],
  ]);

  constructor(private j1ClientFactory: JupiterOneClientFactory) {}

  async provideSystemProperties(
    ctx: RequestContext,
    systemObjectId: string,
    quick: boolean
  ): Promise<SystemPropertyValue[]> {
    if (quick) {
      return [];
    }

    const j1Client = await this.j1ClientFactory();
    const result = await j1Client.queryV1(
      `FIND KSystem with systemId = '${sanitizeJ1QueryParam(systemObjectId)}'`
    );

    const keys = new Map(
      this.definitions.map((definition) => [definition.id, definition])
    );
    const attributes = Object.keys(result[0].properties)
      .filter((key) => keys.has(this.translatedIds.get(key) || key))
      .map((key: any) => {
        const value = result[0].properties[key];
        const def = keys.get(this.translatedIds.get(key) || key)!;
        return {
          ...def,
          displayInList: false, // This makes the property not show up in list views, only in the system details view
          // JupiterOne is a bit too slow to be used in list views. We would need to be smarter about caching.
          value: def.type === "toggle" ? "True" : value.toString(),
        };
      });

    // Sort attributes by order of definition
    attributes.sort((a, b) => {
      return (
        this.definitions.findIndex((d) => d.id === a.id) -
        this.definitions.findIndex((d) => d.id === b.id)
      );
    });

    return attributes;
  }

  async listSystemByPropertyValue(
    ctx: RequestContext,
    propertyId: string,
    value: any
  ): Promise<string[]> {
    const j1Property = this.reverseTranslatedIds.get(propertyId) || propertyId;
    const def = this.definitions.find((d) => d.id === propertyId);
    const j1Client = await this.j1ClientFactory();

    const arg2 =
      def?.type !== "toggle"
        ? `'${sanitizeJ1QueryParam(value)}'`
        : value === "true"
        ? "true"
        : "false";
    const result = await j1Client!.queryV1(
      `FIND KSystem with ${j1Property} = ${arg2}`
    );
    return result.map((r: any) => r.properties.systemId);
  }
}
