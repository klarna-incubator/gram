import System from "./System.js";
import { SystemProvider } from "./SystemProvider.js";
import { RequestContext } from "../providers/RequestContext.js";
import { SystemListInput, SystemListResult } from "./systems.js";

export class DummySystemProvider implements SystemProvider {
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
