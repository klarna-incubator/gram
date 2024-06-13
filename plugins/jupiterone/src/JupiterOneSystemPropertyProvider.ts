import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import { SystemPropertyProvider } from "@gram/core/dist/data/system-property/SystemPropertyProvider.js";
import {
  SystemProperty,
  SystemPropertyValue,
} from "@gram/core/dist/data/system-property/types.js";
import { JupiterOneClient } from "@jupiterone/jupiterone-client-nodejs";
import { sanitizeJ1QueryParam } from "./util.js";

export class JupiterOneSystemPropertyProvider
  implements SystemPropertyProvider
{
  id: string = "jupiterone";
  definitions: SystemProperty[] = [
    {
      id: "tag.srb2:system-risk-level",
      label: "System Risk Level", // srb2:system-risk-level
      type: "radio",
      values: ["ssf", "esf", "hsf"],
    },
    {
      id: "tag.srb2:in-scope-for-evcc",
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

  constructor(private j1Client: JupiterOneClient) {}

  async provideSystemProperties(
    ctx: RequestContext,
    systemObjectId: string,
    quick: boolean
  ): Promise<SystemPropertyValue[]> {
    if (quick) {
      return [];
    }

    const result = await this.j1Client!.queryV1(
      `FIND KSystem with systemId = '${systemObjectId}'`
    );

    const keys = new Map(
      this.definitions.map((definition) => [definition.id, definition])
    );
    const attributes = Object.keys(result[0].properties)
      .filter((key) => keys.has(key))
      .map((key: any) => {
        const value = result[0].properties[key];
        const def = keys.get(key)!;
        return {
          ...def,
          displayInList: false,
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
    const result = await this.j1Client!.queryV1(
      `FIND KSystem with ${propertyId} = '${sanitizeJ1QueryParam(value)}'`
    );
    return result.map((r: any) => r.properties.systemId);
  }
}
