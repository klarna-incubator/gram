import System from "@gram/core/dist/data/systems/System.js";
import {
  SystemListInput,
  SystemListResult,
} from "@gram/core/dist/data/systems/systems.js";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import { SystemProvider } from "@gram/core/dist/data/systems/SystemProvider.js";
import { sampleOwnedSystem } from "./sampleOwnedSystem.js";

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
