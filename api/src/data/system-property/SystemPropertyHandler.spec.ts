import { SystemPropertyProvider } from "./SystemPropertyProvider";
import { SystemPropertyHandler } from "./SystemPropertyHandler";

describe("SystemPropertyProvider implementation", () => {
  describe("contextualize", () => {
    it("should not crash if a provider crashes", async () => {
      const niceProvider: SystemPropertyProvider = {
        id: "nice",
        definitions: [],
        listSystemByPropertyValue: async (filters) => [],
        provideSystemProperties: async () => [],
      };
      const badProvider: SystemPropertyProvider = {
        id: "bad",
        definitions: [],
        listSystemByPropertyValue: async (filters) => {
          throw new Error("not good");
        },
        provideSystemProperties: async () => {
          throw new Error("not good");
        },
      };

      const handler = new SystemPropertyHandler();
      handler.registerSystemPropertyProvider(niceProvider);
      handler.registerSystemPropertyProvider(badProvider);

      const items = await handler.contextualize({}, "some-system-id");
      const expected: any[] = [];
      expect(items).toStrictEqual(expected);
    });

    it("should return properties", async () => {
      const niceProvider: SystemPropertyProvider = {
        id: "nice",
        definitions: [],
        listSystemByPropertyValue: async (filters) => [],
        provideSystemProperties: async (systemObjectId, quick) => [
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

      const items = await handler.contextualize({}, "some-system-id");
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
      const items = await handler.contextualize({}, "some-system-id");
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
        listSystemByPropertyValue: async (filters) => [],
        provideSystemProperties: async () => [],
      };
      const badProvider: SystemPropertyProvider = {
        id: "bad",
        definitions: [
          { batchFilterable: true, id: "bad-prop", label: "bad-prop" },
        ],
        listSystemByPropertyValue: async (filters) => {
          throw new Error("not good");
        },
        provideSystemProperties: async () => {
          throw new Error("not good");
        },
      };

      const handler = new SystemPropertyHandler();
      handler.registerSystemPropertyProvider(niceProvider);
      handler.registerSystemPropertyProvider(badProvider);

      const items = await handler.listSystemsByFilters({}, [
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
        listSystemByPropertyValue: async (filters) => [
          "some-system-id",
          "another-one",
        ],
        provideSystemProperties: async (systemObjectId, quick) => [],
      };

      const handler = new SystemPropertyHandler();
      handler.registerSystemPropertyProvider(niceProvider);

      const items = await handler.listSystemsByFilters({}, [
        { propertyId: "good-prop", value: "yes" },
      ]);
      const expected: any[] = ["some-system-id", "another-one"];
      expect(items).toStrictEqual(expected);
    });

    it("should return empty when no providers", async () => {
      const handler = new SystemPropertyHandler();
      const items = await handler.listSystemsByFilters({}, [
        { propertyId: "good-prop", value: "yes" },
      ]);
      const expected: any[] = [];
      expect(items).toStrictEqual(expected);
    });
  });
});
