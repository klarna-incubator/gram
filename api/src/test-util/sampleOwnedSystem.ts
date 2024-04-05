import System from "@gram/core/dist/data/systems/System.js";
import { sampleOtherTeam, sampleTeam } from "./sampleTeam.js";

export const sampleOwnedSystem = new System(
  "mocked-system-id",
  "mocked system",
  "Mocked System",
  [sampleTeam],
  "system description"
);

export const sampleOtherSystem = new System(
  "other-mocked-system-id",
  "other mocked system",
  "Other Mocked System",
  [sampleOtherTeam],
  "system description"
);
