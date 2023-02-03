import System from "@gram/core/dist/data/systems/System";
import { sampleTeam } from "./sampleTeam";

export const sampleOwnedSystem = new System(
  "mocked-system-id",
  "mocked system",
  "Mocked System",
  [sampleTeam],
  "system description"
);
