import { RequestContext } from "../data/providers/RequestContext";
import { Provider } from "../data/providers/Provider";
import { Team } from "./models/Team";

export interface TeamProvider extends Provider {
  lookup(ctx: RequestContext, teamIds: string[]): Promise<Team[]>;
  getTeamsForUser(ctx: RequestContext, userId: string): Promise<Team[]>;
}
