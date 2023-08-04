import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import System from "@gram/core/dist/data/systems/System";
import { SystemProvider } from "@gram/core/dist/data/systems/SystemProvider";
import {
  SystemListFilter,
  SystemListInput,
  SystemListResult,
} from "@gram/core/dist/data/systems/systems";

export class StaticSystemProvider implements SystemProvider {
  key: string = "static";
  systemMap: Map<string, System> = new Map();

  constructor(public systems: System[]) {
    systems.forEach((s) => {
      this.systemMap.set(s.id, s);
    });
  }

  async getSystem(
    ctx: RequestContext,
    systemId: string
  ): Promise<System | null> {
    return this.systemMap.get(systemId) || null;
  }

  async listSystems(
    ctx: RequestContext,
    input: SystemListInput,
    pagination: { page: number; pageSize: number }
  ): Promise<SystemListResult> {
    const result: SystemListResult = {
      systems: [],
      total: 0,
    };

    // Very inefficient filters - If you have a lot of systems, use an index.
    switch (input.filter) {
      // Filters by team
      case SystemListFilter.Team:
        result.systems = this.systems
          .filter((s) => s.owners.map((o) => o.id).includes(input.opts.teamId))
          .slice(
            pagination.page * pagination.pageSize,
            (pagination.page + 1) * pagination.pageSize
          );
        result.total = result.systems.length;
        break;

      // Filters by a list of system ids
      case SystemListFilter.Batch:
        result.systems = input.opts.ids
          .map((id) => this.systemMap.get(id))
          .filter((s) => !!s) as System[];
        result.total = result.systems.length;
        break;

      // Filter by system name
      case SystemListFilter.Search:
        const searchText = input.opts.search.toLowerCase();
        result.systems = this.systems
          .filter(
            (s) =>
              s.shortName.toLowerCase().includes(searchText) ||
              s.displayName.toLowerCase().includes(searchText) ||
              s.id.toLowerCase().includes(searchText)
          )
          .slice(
            pagination.page * pagination.pageSize,
            (pagination.page + 1) * pagination.pageSize
          );
        result.total = result.systems.length;
    }

    return result;
  }
}
