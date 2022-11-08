import { SystemPropertyProvider, SystemPropertyHandler } from "./index";

describe("SystemPropertyProvider implementation", () => {
  describe("contextualize", () => {
    it("should not crash if a provider crashes", async () => {
      const niceProvider: SystemPropertyProvider = {
        id: "nice",
        definitions: [],
        list: async (filters) => [],
        provide: async () => [],
      };
      const badProvider: SystemPropertyProvider = {
        id: "bad",
        definitions: [],
        list: async (filters) => {
          throw new Error("not good");
        },
        provide: async () => {
          throw new Error("not good");
        },
      };

      const handler = new SystemPropertyHandler();
      handler.registerSystemPropertyProvider(niceProvider);
      handler.registerSystemPropertyProvider(badProvider);

      const items = await handler.contextualize("some-system-id");
      const expected: any[] = [];
      expect(items).toStrictEqual(expected);
    });

    it("should return properties", async () => {
      const niceProvider: SystemPropertyProvider = {
        id: "nice",
        definitions: [],
        list: async (filters) => [],
        provide: async (systemObjectId, quick) => [
          {
            batchFilterable: false,
            displayInList: false,
            id: "some-prop",
            label: "some property",
            value: "yes",
            description: "longer description",
          },
        ],
      };

      const handler = new SystemPropertyHandler();
      handler.registerSystemPropertyProvider(niceProvider);

      const items = await handler.contextualize("some-system-id");
      const expected: any[] = [
        {
          batchFilterable: false,
          displayInList: false,
          id: "some-prop",
          label: "some property",
          value: "yes",
          description: "longer description",
          source: "nice",
        },
      ];
      expect(items).toStrictEqual(expected);
    });

    it("should return empty when no providers", async () => {
      const handler = new SystemPropertyHandler();
      const items = await handler.contextualize("some-system-id");
      const expected: any[] = [];
      expect(items).toStrictEqual(expected);
    });
  });

  describe("list", () => {
    it("should not crash if a provider crashes", async () => {
      const niceProvider: SystemPropertyProvider = {
        id: "nice",
        definitions: [
          { batchFilterable: true, id: "good-prop", label: "good-prop" },
        ],
        list: async (filters) => [],
        provide: async () => [],
      };
      const badProvider: SystemPropertyProvider = {
        id: "bad",
        definitions: [
          { batchFilterable: true, id: "bad-prop", label: "bad-prop" },
        ],
        list: async (filters) => {
          throw new Error("not good");
        },
        provide: async () => {
          throw new Error("not good");
        },
      };

      const handler = new SystemPropertyHandler();
      handler.registerSystemPropertyProvider(niceProvider);
      handler.registerSystemPropertyProvider(badProvider);

      const items = await handler.listSystemsByFilters([
        { propertyId: "good-prop", value: "yes" },
        { propertyId: "bad-prop", value: "42" },
      ]);
      const expected: any[] = [];
      expect(items).toStrictEqual(expected);
    });

    it("should return systems", async () => {
      const niceProvider: SystemPropertyProvider = {
        id: "nice",
        definitions: [
          { batchFilterable: true, id: "good-prop", label: "good-prop" },
        ],
        list: async (filters) => ["some-system-id", "another-one"],
        provide: async (systemObjectId, quick) => [],
      };

      const handler = new SystemPropertyHandler();
      handler.registerSystemPropertyProvider(niceProvider);

      const items = await handler.listSystemsByFilters([
        { propertyId: "good-prop", value: "yes" },
      ]);
      const expected: any[] = ["some-system-id", "another-one"];
      expect(items).toStrictEqual(expected);
    });

    it("should return empty when no providers", async () => {
      const handler = new SystemPropertyHandler();
      const items = await handler.listSystemsByFilters([
        { propertyId: "good-prop", value: "yes" },
      ]);
      const expected: any[] = [];
      expect(items).toStrictEqual(expected);
    });
  });
});
