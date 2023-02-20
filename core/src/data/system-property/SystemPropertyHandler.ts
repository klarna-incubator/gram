import { getLogger } from "../../logger";
import { RequestContext } from "../providers/RequestContext";
import { SystemProperty, SystemPropertyValue } from "./types";
import { SystemPropertyProvider } from "./SystemPropertyProvider";

export class SystemPropertyHandler {
  constructor() {
    this.providers = [];
    this.properties = new Map();
    this.providedBy = new Map();
    this.log = getLogger("SystemPropertyHandler");
  }

  log: any;
  providers: SystemPropertyProvider[];
  properties: Map<string, SystemProperty>;
  providedBy: Map<string, SystemPropertyProvider>;

  /**
   * Register a SystemPropertyProvider to be used for fetching Context on a threat model
   * @param provider
   */
  registerSystemPropertyProvider(provider: SystemPropertyProvider) {
    this.log.info(`registered SystemPropertyProvider ${provider.id}`);
    this.providers.push(provider);

    provider.definitions.map((d) => {
      this.properties.set(d.id, d);
      this.providedBy.set(d.id, provider);
    });
  }

  async getProperties(ctx: RequestContext): Promise<SystemProperty[]> {
    const properties = Array.from(this.properties.values());

    for (let prop of properties) {
      if (prop.type === "radio" && !Array.isArray(prop.values)) {
        prop.values = await prop.values(ctx);
      }
    }

    return properties;
  }

  /**
   * Fetch all System Properties to do with a given model
   * @param model
   * @returns
   */
  async contextualize(
    ctx: RequestContext,
    systemId: string,
    quick = false
  ): Promise<SystemPropertyValue[]> {
    const items: SystemPropertyValue[] = [];
    const batches = await Promise.all(
      this.providers.map(async (p) => {
        try {
          const pItems = await p.provideSystemProperties(ctx, systemId, quick);
          return pItems.map((i) => ({ ...i, source: p.id }));
        } catch (error: any) {
          this.log.error(
            `SystemPropertyProvider ${p.id} errored while providing context`,
            error
          );
          return [];
        }
      })
    );
    batches.forEach((pItems) => items.push(...pItems));
    return items;
  }

  validateFilters(filters: { propertyId: string; value: any }[]) {
    return filters.filter((f) => {
      const type = this.properties.get(f.propertyId)?.type;
      if (!type) {
        return false;
      }
      if (type === "readonly") {
        return false;
      }
      if (type === "toggle" && f.value === "false") {
        return false;
      }
      return true;
    });
  }

  /**
   * List systems based on Properties and their values.
   */
  async listSystemsByFilters(
    ctx: RequestContext,
    filters: { propertyId: string; value: any }[]
  ) {
    // Only filter properties that have a type.
    filters = this.validateFilters(filters);

    const results = await Promise.all(
      filters.map(async ({ propertyId, value }) => {
        const provider = this.providedBy.get(propertyId);
        if (!provider) {
          return null;
        }
        try {
          return await provider.listSystemByPropertyValue(
            ctx,
            propertyId,
            value
          );
        } catch (err: any) {
          this.log.error(
            `provider ${provider.id} errored while attempting to filter for systems`,
            err
          );
          return null;
        }
      })
    );

    const systems = results
      .filter((result) => Array.isArray(result))
      .reduce(
        (prev, curr, idx) =>
          new Set(curr?.filter((c) => idx < 1 || prev.has(c))),
        new Set<string>()
      );

    return Array.from(systems);
  }
}
