import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import System from "@gram/core/dist/data/systems/System.js";
import { JupiterOneSystemProvider } from "@gram/jupiterone";
import { OctaneSystemProvider } from "./system/OctaneSystemProvider.js";
import { OverloadedJupiterOneClient } from "@gram/jupiterone";

export class KlarnaSystemProvider extends JupiterOneSystemProvider {
  constructor(
    private octaneSystemProvider: OctaneSystemProvider,
    j1client: OverloadedJupiterOneClient
  ) {
    super(j1client);
  }

  id: string = "klarna";
  async getSystem(
    ctx: RequestContext,
    systemId: string
  ): Promise<System | null> {
    const result = await super.getSystem(ctx, systemId);

    if (!result) {
      return null;
    }

    const system = await this.octaneSystemProvider.getOctaneSystem(systemId);
    result.description = system?.system_description;

    return result;
  }
}
