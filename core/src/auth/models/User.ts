import { Team } from "./Team";

export type User = {
  sub: string;
  name: string;

  // Optional attributes
  mail?: string;
  slackId?: string;
  teams: Team[];
};
