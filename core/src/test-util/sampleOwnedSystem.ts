import System from "../data/systems/System.js";
import { sampleTeam } from "./sampleTeam.js";

export const sampleOwnedSystem = new System(
  "mocked-system-id",
  "mocked system",
  "Mocked System",
  [sampleTeam],
  "system description"
);
