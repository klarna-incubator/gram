import { RequestContext } from "../data/providers/RequestContext";
import { Team } from "./models/Team";
import { TeamProvider } from "./TeamProvider";

export class DummyTeamProvider implements TeamProvider {
  async lookup(ctx: RequestContext, teamIds: string[]): Promise<Team[]> {
    return [];
  }
  async getTeamsForUser(ctx: RequestContext, userId: string): Promise<Team[]> {
    return [];
  }
  key = "default";
}

export class TeamHandler {
  constructor() {}

  teamProvider: TeamProvider = new DummyTeamProvider();

  setTeamProvider(teamProvider: TeamProvider): void {
    this.teamProvider = teamProvider;
  }

  async getTeam(ctx: RequestContext, teamId: string): Promise<Team | null> {
    const teams = await this.teamProvider.lookup(ctx, [teamId]);
    if (!teams || teams.length === 0) {
      return null;
    }
    return teams[0];
  }

  async getTeamsForUser(ctx: RequestContext, userId: string): Promise<Team[]> {
    return this.teamProvider.getTeamsForUser(ctx, userId);
  }
}
