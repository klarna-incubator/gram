import { RequestContext } from "../data/providers/RequestContext.js";
import { Provider } from "../data/providers/Provider.js";
import { Team } from "./models/Team.js";

export interface TeamProvider extends Provider {
  lookup(ctx: RequestContext, teamIds: string[]): Promise<Team[]>;
  getTeamsForUser(ctx: RequestContext, userId: string): Promise<Team[]>;
}
