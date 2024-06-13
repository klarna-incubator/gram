import { SystemListFilter } from "@gram/core/dist/data/systems/systems.js";
import { OctaneSystemProvider } from "./OctaneSystemProvider.js";

/**
 * These test against the actual Octane API
 */
describe("SystemProvider Octane Integration Test", () => {
  const systemProvider = new OctaneSystemProvider();
  beforeAll(async () => systemProvider.loadSystems());

  describe("getSystem", () => {
    it("should return correct gram values", async () => {
      const system = await systemProvider.getSystem({}, "gram");
      expect(system?.id).toBe("gram");
      expect(system?.shortName).toBe("gram");
      expect(system?.displayName).toBe("Gram");
      expect(system?.description).toBe("Threat modelling tool");
    });

    it("should return null value", async () => {
      const system = await systemProvider.getSystem({}, "non-existant");
      expect(system).toBe(null);
    });
  });

  describe("list", () => {
    it('should return available systems from "group" filter', async () => {
      const systems = (
        await systemProvider.listSystems(
          {},
          {
            filter: SystemListFilter.Team,
            opts: {
              teamId: "200031",
            },
          }
        )
      ).systems;
      expect(systems.length).toBeGreaterThan(2);
      expect(systems[0].id).toBeDefined();
      expect(systems[0].shortName).toBeDefined();
      expect(systems[0].displayName).toBeDefined();
    });

    it('should return available systems from "batch" filter', async () => {
      const systems = (
        await systemProvider.listSystems(
          {},
          {
            filter: SystemListFilter.Batch,
            opts: {
              ids: ["gram"],
            },
          }
        )
      ).systems;
      expect(systems.length).toBeGreaterThanOrEqual(1);
      expect(systems[0].id).toBeDefined();
      expect(systems[0].shortName).toBeDefined();
      expect(systems[0].displayName).toBeDefined();
    });
  });
});
