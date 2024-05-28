import { TeamProvider } from "@gram/core/dist/auth/TeamProvider.js";
import { Team } from "@gram/core/dist/auth/models/Team.js";

import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import {
  SearchFilter,
  SearchProvider,
  SearchProviderResult,
  SearchType,
} from "@gram/core/dist/search/SearchHandler.js";

export class StaticTeamProvider implements TeamProvider, SearchProvider {
  constructor(
    public teams: Team[],
    public UserIdToTeamIds: Map<string, string[]>
  ) {}

  searchType: SearchType = { key: "team", label: "Team" };

  async search(filter: SearchFilter): Promise<SearchProviderResult> {
    const result: SearchProviderResult = {
      items: [],
      count: 0,
      type: this.searchType.key,
    };

    // Very inefficient filters - If you have a lot of teams, use an index.
    const searchText = filter.searchText.toLowerCase();
    result.items = this.teams
      .filter(
        (t) =>
          t.name.toLowerCase().includes(searchText) ||
          t.id.toLowerCase().includes(searchText)
      )
      .map((t) => ({
        id: t.id,
        label: t.name,
        url: `/team/${t.id}`,
      }));

    result.count = result.items.length;

    // Simulate paging
    result.items = result.items.slice(
      filter.page * filter.pageSize,
      (filter.page + 1) * filter.pageSize
    );

    return Promise.resolve(result);
  }

  async lookup(ctx: RequestContext, teamIds: string[]): Promise<Team[]> {
    return teamIds
      .map((tid) => this.teams.find((team) => team.id === tid))
      .filter((t) => t) as Team[];
  }

  async getTeamsForUser(ctx: RequestContext, userId: string): Promise<Team[]> {
    const teamIds = this.UserIdToTeamIds.get(userId) || [];
    return this.lookup(ctx, teamIds);
  }

  key: string = "static";
}
