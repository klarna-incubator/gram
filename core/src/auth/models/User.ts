import { Team } from "./Team.js";

export type User = {
  sub: string;
  name: string;

  // Optional attributes
  mail?: string;
  slackUrl?: string;
};
