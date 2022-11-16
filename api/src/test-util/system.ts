import System from "../data/systems/System";
import {
  AppContext,
  SystemListInput,
  SystemListResult,
  SystemProvider,
} from "../data/systems/SystemProvider";
import { sampleOwnedSystem } from "./sampleOwnedSystem";

const systems = [sampleOwnedSystem];

export async function getMockedSystemById(
  systemId: string
): Promise<System | null> {  
  return systems.find((s) => s.id === systemId) || null;
}

class TestSystemProvider implements SystemProvider {
  async getSystem(ctx: AppContext, systemId: string): Promise<System | null> {
    return getMockedSystemById(systemId);
  }
  async listSystems(
    ctx: AppContext,
    input: SystemListInput,
    pagination: { page: number; pageSize: number }
  ): Promise<SystemListResult> {
    return { systems, total: systems.length };
  }
  key = "test";
}

export const testSystemProvider = new TestSystemProvider();
