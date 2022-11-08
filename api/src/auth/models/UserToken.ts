import { Role } from "./Role";
import { Team } from "./Team";

export interface UserToken {
  sub: string;
  name?: string;
  roles: Role[];
  teams: Team[];
  picture?: string;
  slackId?: string;
  provider?: string;
}
