import { TeamProvider } from "@gram/core/dist/auth/TeamProvider.js";
import { Team } from "@gram/core/dist/auth/models/Team.js";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import {
  sampleAdmin,
  sampleOtherUser,
  sampleReviewer,
  sampleUser,
} from "./sampleUser.js";
import { sampleTeam, sampleOtherTeam, teams } from "./sampleTeam.js";

export class TestTeamProvider implements TeamProvider {
  private teamMap: Map<string, string[]>;

  constructor() {
    this.teamMap = new Map([
      [sampleUser.sub, [sampleTeam.id]],
      [sampleOtherUser.sub, [sampleOtherTeam.id]],
      [sampleReviewer.sub, [sampleOtherTeam.id]],
      [sampleAdmin.sub, [sampleTeam.id, sampleOtherTeam.id]],
    ]);
  }
  async lookup(ctx: RequestContext, teamIds: string[]): Promise<Team[]> {
    return teamIds
      .map((tid) => teams.find((team) => team.id === tid))
      .filter((t) => t) as Team[];
  }
  async getTeamsForUser(ctx: RequestContext, userId: string): Promise<Team[]> {
    return this.lookup(ctx, this.teamMap.get(userId) || []);
  }
  key: string = "test";
}
