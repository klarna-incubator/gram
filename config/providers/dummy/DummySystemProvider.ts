import { SystemProvider } from "@gram/core/dist/data/systems/SystemProvider";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import System from "@gram/core/dist/data/systems/System";
import {
  SystemListInput,
  SystemListResult,
} from "@gram/core/dist/data/systems/systems";

export class DummySystemProvider implements SystemProvider {
  getSystem(ctx: RequestContext, systemId: string): Promise<System | null> {
    throw new Error("Method not implemented.");
  }
  listSystems(
    ctx: RequestContext,
    input: SystemListInput,
    pagination: { page: number; pageSize: number }
  ): Promise<SystemListResult> {
    throw new Error("Method not implemented.");
  }
  key: string = "dummy";
}
