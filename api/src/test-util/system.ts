import System from "@gram/core/dist/data/systems/System";
import {
  SystemListInput,
  SystemListResult,
} from "@gram/core/dist/data/systems/systems";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { SystemProvider } from "@gram/core/dist/data/systems/SystemProvider";
import { sampleOwnedSystem } from "./sampleOwnedSystem";

const systems = [sampleOwnedSystem];

export async function getMockedSystemById(
  systemId: string
): Promise<System | null> {
  return systems.find((s) => s.id === systemId) || null;
}

class TestSystemProvider implements SystemProvider {
  async getSystem(
    ctx: RequestContext,
    systemId: string
  ): Promise<System | null> {
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
