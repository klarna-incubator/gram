import { Provider } from "../providers/Provider.js";
import System from "./System.js";
import { SystemListInput, SystemListResult } from "./systems.js";
import { RequestContext } from "../providers/RequestContext.js";

export interface SystemProvider extends Provider {
  getSystem(ctx: RequestContext, systemId: string): Promise<System | null>;
  listSystems(
    ctx: RequestContext,
    input: SystemListInput,
    pagination: { page: number; pageSize: number }
  ): Promise<SystemListResult>;
}
