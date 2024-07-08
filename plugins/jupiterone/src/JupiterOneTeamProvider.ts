import { TeamProvider } from "@gram/core/dist/auth/TeamProvider.js";
import { Team } from "@gram/core/dist/auth/models/Team.js";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import {
  SearchFilter,
  SearchProvider,
  SearchProviderResult,
  SearchType,
} from "@gram/core/dist/search/SearchHandler.js";
import { JupiterOneClientFactory } from "./client.js";
import { sanitizeJ1QueryParam } from "./util.js";

export class JupiterOneTeamProvider implements TeamProvider, SearchProvider {
  key: string = "jupiterone";

  searchType: SearchType = {
    key: "team",
    label: "Team",
  };

  constructor(private j1ClientFactory: JupiterOneClientFactory) {}

  async lookup(ctx: RequestContext, teamIds: string[]): Promise<Team[]> {
    const j1Client = await this.j1ClientFactory();
    const result = await j1Client.queryV1(
      `FIND Team with accountabilityCode = (${teamIds
        .map((t) => `'${sanitizeJ1QueryParam(t)}'`)
        .join(" OR ")})`
    );

    return result.map((team: any) => {
      return {
        id: team.properties.accountabilityCode,
        name: team.properties.name,
        email: team.properties.teamEmail,
        slack: team.properties.teamSlack,
      };
    });
  }

  async getTeamsForUser(ctx: RequestContext, userId: string): Promise<Team[]> {
    const j1Client = await this.j1ClientFactory();
    const query = `FIND Team WITH _type = 'startup_team' AND inactive != 'Yes' 
      That has Person
      WHERE Person.mail = '${sanitizeJ1QueryParam(userId)}'`;

    const result = await j1Client.queryV1(query);
    return result.map((team: any) => {
      return {
        id: team.properties.accountabilityCode,
        name: team.properties.name,
        email: team.properties.teamEmail,
        slack: team.properties.teamSlack,
      };
    });
  }

  async search(filter: SearchFilter): Promise<SearchProviderResult> {
    const j1Client = await this.j1ClientFactory();
    // Always fetches all results, which is pretty awkward. No real pagination available.
    // https://github.com/JupiterOne/jupiterone-client-nodejs/blob/main/src/index.ts#L48
    const query = `FIND Team with _type = 'startup_team' AND inactive != 'Yes' AND displayName ~= '${sanitizeJ1QueryParam(
      filter.searchText
    )}'`;
    const result = await j1Client.queryV1(query, {});

    const pagedResult = result.slice(
      filter.page * filter.pageSize,
      (filter.page + 1) * filter.pageSize
    );

    return {
      count: result.length,
      items: pagedResult.map((team: any) => {
        return {
          id: team.properties.accountabilityCode,
          label: team.entity.displayName,
          url: `/team/${team.properties.accountabilityCode}`,
        };
      }),
    };
  }
}
