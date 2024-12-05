import {
  Resource,
  ResourceProvider,
} from "@gram/core/dist/resources/ResourceHandler.js";

class TestResourceProvider implements ResourceProvider {
  key = "testProvider";
  async listResources(systemId: string): Promise<Resource[]> {
    if (systemId === "mocked-system-id") {
      return [
        {
          id: "test-resource-id",
          displayName: "Test Resource",
          type: "external entity",
          systemId: "another-mocked-system-id",
          attributes: {},
        },
      ];
    }
    return [];
  }
}

export const testResourceProvider = new TestResourceProvider();
