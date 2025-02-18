import {
  Resource,
  ResourceProvider,
} from "@gram/core/dist/resources/ResourceHandler.js";
export class StaticResourceProvider implements ResourceProvider {
  // This class is an example of resource provider that returns static resources for any system
  key: string = "static";
  async listResources(systemId: string): Promise<Resource[]> {
    return [
      {
        id: "a9fb36c1-fa93-4518-b294-2794b11d2f36",
        displayName: "Static Resource",
        type: "external entity",
        systemId: "systemId",
        attributes: {
          "IP Address": "0.0.0.0",
          Port: "8080",
          Hostname: "example.com",
        },
      },
      {
        id: "c9336445-02d2-4134-b264-485001e87f43",
        displayName: "Another Static Resource",
        type: "external entity",
        systemId: "systemId",
        attributes: {
          "IP Address": "1.1.1.1",
          Port: "80",
          Hostname: "example.org",
        },
      },
      {
        id: "1c21a164-54c9-4df2-9034-543dd2f3b827",
        displayName: "Yet Another Static Resource",
        type: "datastore",
        systemId: "systemId",
        attributes: {
          "db type": "aurora_cluster",
          "db name": "my_db",
        },
      },
    ];
  }
}
