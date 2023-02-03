import System from "./System";
import { SystemProvider } from "./SystemProvider";
import { RequestContext } from "../providers/RequestContext";

export enum SystemListFilter {
  Batch = "batch",
  Search = "search",
  Team = "team",
}

export type SystemListInput =
  | {
      filter: SystemListFilter.Search;
      opts: { search: string };
    }
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

class DefaultSystemProvider implements SystemProvider {
  key = "default";
  getSystem(ctx: RequestContext, systemId: string): Promise<System | null> {
    throw new Error("Method not implemented.");
  }
  listSystems(
    ctx: RequestContext,
    input: SystemListInput,
    pagination: { page: number; pageSize: number } = { page: 0, pageSize: 10 }
  ): Promise<SystemListResult> {
    throw new Error("Method not implemented.");
  }
}

export let systemProvider: SystemProvider = new DefaultSystemProvider();

export function setSystemProvider(newSystemProvider: SystemProvider) {
  systemProvider = newSystemProvider;
}
