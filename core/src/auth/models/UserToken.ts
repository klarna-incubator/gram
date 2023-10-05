import { Role } from "./Role.js";
import { Team } from "./Team.js";

export interface UserToken {
  sub: string;
  name?: string;
  roles: Role[];
  teams: Team[];
  picture?: string;
  slackId?: string;
  provider?: string;
  providerToken?: string;
}
