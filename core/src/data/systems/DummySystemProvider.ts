import System from "./System";
import { SystemProvider } from "./SystemProvider";
import { RequestContext } from "../providers/RequestContext";
import { SystemListInput, SystemListResult } from "./systems";

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
