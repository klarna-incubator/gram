import System from "./System.js";
import { SystemProvider } from "./SystemProvider.js";
import { DummySystemProvider } from "./DummySystemProvider.js";

export enum SystemListFilter {
  Batch = "batch",
  Team = "team",
}

export type SystemListInput =
  | { filter: SystemListFilter.Batch; opts: { ids: string[] } }
  | { filter: SystemListFilter.Team; opts: { teamId: string } };

export type SystemListResult = {
  systems: System[];
  total: number;
};

export interface SystemOwner {
  id: string;
  name: string;
}

export let systemProvider: SystemProvider = new DummySystemProvider();

export function setSystemProvider(newSystemProvider: SystemProvider) {
  systemProvider = newSystemProvider;
}
