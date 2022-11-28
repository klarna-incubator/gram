import System from "../data/systems/System";
import { SystemListInput, SystemListResult } from "../data/systems/systems";
import { RequestContext } from "../data/providers/RequestContext";
import { SystemProvider } from "../data/systems/SystemProvider";
import { sampleOwnedSystem } from "./sampleOwnedSystem";

const systems = [sampleOwnedSystem];

export async function getMockedSystemById(
  systemId: string
): Promise<System | null> {
  return systems.find((s) => s.id === systemId) || null;
}

class TestSystemProvider implements SystemProvider {
  async getSystem(ctx: RequestContext, systemId: string): Promise<System | null> {
    return getMockedSystemById(systemId);
  }
  async listSystems(
    ctx: RequestContext,
    input: SystemListInput,
    pagination: { page: number; pageSize: number }
  ): Promise<SystemListResult> {
    return { systems, total: systems.length };
  }
  key = "test";
}

export const testSystemProvider = new TestSystemProvider();
