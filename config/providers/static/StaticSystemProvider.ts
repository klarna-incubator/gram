import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import System from "@gram/core/dist/data/systems/System.js";
import { SystemProvider } from "@gram/core/dist/data/systems/SystemProvider.js";
import {
  SystemListFilter,
  SystemListInput,
  SystemListResult,
} from "@gram/core/dist/data/systems/systems.js";
import {
  SearchFilter,
  SearchProvider,
  SearchProviderResult,
  SearchType,
} from "@gram/core/dist/search/SearchHandler.js";

export class StaticSystemProvider implements SystemProvider, SearchProvider {
  key: string = "static";
  systemMap: Map<string, System> = new Map();

  constructor(public systems: System[]) {
    systems.forEach((s) => {
      this.systemMap.set(s.id, s);
    });
  }

  searchType: SearchType = { key: "system", label: "System" };
  async search(filter: SearchFilter): Promise<SearchProviderResult> {
    const result: SearchProviderResult = {
      items: [],
      count: 0,
    };

    // Very inefficient filters - If you have a lot of systems, use an index.
    const searchText = filter.searchText.toLowerCase();
    result.items = this.systems
      .filter(
        (s) =>
          s.shortName.toLowerCase().includes(searchText) ||
          s.displayName.toLowerCase().includes(searchText) ||
          s.id.toLowerCase().includes(searchText)
      )
      .map((s) => ({
        id: s.id,
        label: s.displayName,
        url: `/system/${s.id}`,
      }));

    result.count = result.items.length;

    // Simulate paging
    result.items = result.items.slice(
      filter.page * filter.pageSize,
      (filter.page + 1) * filter.pageSize
    );

    return result;
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
        result.systems = this.systems.filter((s) =>
          s.owners.map((o) => o.id).includes(input.opts.teamId)
        );
        break;

      // Filters by a list of system ids
      case SystemListFilter.Batch:
        if (!input.opts.ids || input.opts.ids.length === 0) {
          return result;
        }
        result.systems = input.opts.ids
          .map((id) => this.systemMap.get(id))
          .filter((s) => !!s) as System[];
        break;
    }

    result.total = result.systems.length;
    result.systems = result.systems.slice(
      pagination.page * pagination.pageSize,
      (pagination.page + 1) * pagination.pageSize
    );

    return result;
  }
}
