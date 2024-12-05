import { Provider } from "../data/providers/Provider.js";
export type ResourceType =
  | "external entity"
  | "datastore"
  | "process"
  | "dataflow"
  | "trust boundary";

export interface Resource {
  id: string;
  displayName: string;
  type: ResourceType;
  systemId: string;
  /**
   * Attributes are security details about the resources.
   * They are meant to help Gram user making decision during threat modeling.
   */
  attributes: Record<string, string>;
}

export type ResourceResult = Resource[];

export interface ResourceProvider extends Provider {
  listResources(systemId: string): Promise<Resource[]>;
}

export class ResourceHandler {
  resourceProviders: ResourceProvider[];

  constructor() {
    this.resourceProviders = [];
  }

  register(provider: ResourceProvider): void {
    this.resourceProviders.push(provider);
  }

  async getResources(systemId: string): Promise<ResourceResult> {
    return [
      await Promise.all(
        this.resourceProviders.map((provider) =>
          provider.listResources(systemId)
        )
      ),
    ].flat(2);
  }
}
