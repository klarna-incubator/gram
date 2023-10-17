import { Team } from "@gram/core/dist/auth/models/Team.js";

export const sampleTeam: Team = {
  id: "123",
  name: "team",
  email: "aa",
};

export const sampleOtherTeam: Team = {
  id: "999",
  name: "other team",
  email: "bb",
};

export const teams = [sampleTeam, sampleOtherTeam];
