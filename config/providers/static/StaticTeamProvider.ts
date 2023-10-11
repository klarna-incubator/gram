import { TeamProvider } from "@gram/core/dist/auth/TeamProvider.js";
import { Team } from "@gram/core/dist/auth/models/Team.js";

import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";

export class StaticTeamProvider implements TeamProvider {
  constructor(
    public teams: Team[],
    public UserIdToTeamIds: Map<string, string[]>
  ) {}

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
