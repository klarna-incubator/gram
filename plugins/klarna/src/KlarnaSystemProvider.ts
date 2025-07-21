import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import System from "@gram/core/dist/data/systems/System.js";
import {
  JupiterOneSystemProvider,
  JupiterOneClientFactory,
} from "@gram/jupiterone";
import { SystemRegistrySystemProvider } from "./system/SystemRegistrySystemProvider.js";

export class KlarnaSystemProvider extends JupiterOneSystemProvider {
  constructor(
    private registrySystemProvider: SystemRegistrySystemProvider,
    j1clientFactory: JupiterOneClientFactory
  ) {
    super(j1clientFactory);
  }

  id: string = "klarna";
  async getSystem(
    ctx: RequestContext,
    systemId: string
  ): Promise<System | null> {
    return await this.registrySystemProvider.getSystem(ctx, systemId);
  }
}
