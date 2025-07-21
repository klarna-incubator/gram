import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import { SystemPropertyProvider } from "@gram/core/dist/data/system-property/SystemPropertyProvider.js";
import {
  SystemProperty,
  SystemPropertyValue,
} from "@gram/core/dist/data/system-property/types.js";
import { JupiterOneClientFactory } from "./client.js";
import { sanitizeJ1QueryParam } from "./util.js";

export class JupiterOneDomainSystemPropertyProvider
  implements SystemPropertyProvider
{
  id: string = "jupiterone-domain";
  definitions: SystemProperty[] = [
    {
      id: "domain",
      label: "Domain",
      type: "radio",
      values: (ctx: RequestContext) => this.initDomainValues(),
    },
  ];

  constructor(private j1ClientFactory: JupiterOneClientFactory) {}

  async initDomainValues() {
    const j1Client = await this.j1ClientFactory();
    const result = await j1Client.queryV1(
      `FIND domain as d return d.displayName as domain`
    );

    const domainValues = new Set<string>();
    result.forEach((r: any) => {
      domainValues.add(r.domain);
    });

    return Array.from(domainValues);
  }

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
      `
      FIND KSystem with systemId = '${sanitizeJ1QueryParam(systemObjectId)}'
      THAT relates to Team as team                
      RETURN team
      `
    );

    const domain = result[0].team.properties["tag.Domain"];

    return [
      {
        id: "domain",
        label: "Domain",
        value: domain,
        displayInList: true,
      },
    ];
  }

  async listSystemByPropertyValue(
    ctx: RequestContext,
    propertyId: string,
    value: any
  ): Promise<string[]> {
    const j1Client = await this.j1ClientFactory();
    const result = await j1Client!.queryV1(
      `FIND KSystem
       THAT relates to Team as team    
       WHERE team.tag.Domain = '${sanitizeJ1QueryParam(value)}'
       `
    );
    return result.map((r: any) => r.properties.systemId);
  }
}
