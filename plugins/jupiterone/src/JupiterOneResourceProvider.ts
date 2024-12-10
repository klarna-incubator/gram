import {
  Resource,
  ResourceProvider,
  ResourceType,
} from "@gram/core/dist/resources/ResourceHandler.js";
import { JupiterOneClientFactory } from "./client.js";
import { sanitizeJ1QueryParam } from "./util.js";

function resultToResource(
  result: Record<string, any>,
  type: ResourceType,
  additionalAttributes: Record<string, any> = {}
): Resource {
  return {
    id: result.systemId,
    type: type,
    displayName: result.displayName,
    systemId: result.systemId,
    attributes: {
      ...additionalAttributes,
      ...formatAttributes(result),
    },
  };
}

function formatAttributes(result: any): Record<string, any> {
  return Object.entries(result).reduce(
    (acc: Record<string, any>, [key, value]) => {
      if (!["id", "displayName", "systemId"].includes(key)) {
        acc[key] = String(value);
      }
      return acc;
    },
    {}
  );
}

export class JupiterOneResourceProvider implements ResourceProvider {
  key: string = "jupiterone";

  constructor(private j1ClientFactory: JupiterOneClientFactory) {}

  async listResources(systemId: string): Promise<Resource[]> {
    const externalEntities = await this.getExternalEntities(systemId);
    const datastores = await this.getDatastores(systemId);

    return [...externalEntities, ...datastores];
  }

  async getExternalEntities(systemId: string): Promise<Resource[]> {
    const j1Client = await this.j1ClientFactory();
    const dependingSystemResult = await j1Client.queryV1(
      `FIND UNIQUE KSystem as system 
    THAT DEPENDS >> KSystem WITH systemId = '${sanitizeJ1QueryParam(systemId)}' 
    RETURN system.displayName as displayName, system.systemId as systemId, system._type as systemType, 
    system.audienceClass as audienceClass, system.availabilityClass as availabilityClass, system.confidentialityClass as confidentialityClass, 
    system.integrityClass as integrityClass, system.lifecycleState as lifecycleState
      `
    );

    let dependingSystems = dependingSystemResult.map((result) =>
      resultToResource(result, "external entity", {
        relationship: "depending system",
      })
    );

    const dependencyResult = await j1Client.queryV1(
      `FIND UNIQUE KSystem as system 
    THAT DEPENDS << KSystem WITH systemId = '${sanitizeJ1QueryParam(systemId)}' 
    RETURN system.displayName as displayName, system.systemId as systemId, system._type as systemType, 
    system.audienceClass as audienceClass, system.availabilityClass as availabilityClass, system.confidentialityClass as confidentialityClass, 
    system.integrityClass as integrityClass, system.lifecycleState as lifecycleState
        `
    );

    let dependencySystems = dependencyResult.map((result) =>
      resultToResource(result, "external entity", {
        relationship: "dependency",
      })
    );

    return [...dependingSystems, ...dependencySystems];
  }

  async getDatastores(systemId: string): Promise<Resource[]> {
    const j1Client = await this.j1ClientFactory();
    const datastores = await j1Client.queryV1(
      `FIND Account WITH tag.environment = 'production' AS account
    THAT HAS Service 
    THAT HAS DataStore as d 
    THAT OWNS << KSystem WITH systemId = '${sanitizeJ1QueryParam(
      systemId
    )}' as s 
    RETURN account.name as account_name, d.accountId as accountId, 
    d._type as type, d.id as id, d.name as displayName, d.engine as engine, d.bucketName as bucketName, 
    d.region as region, d.encrypted as encrypted, d.hasBackup as hasBackup, d.continuousBackupEnabled as continuousBackupEnabled, 
    d.arn as arn, s.systemId as systemId, account.tag.environment as environment, d.iamDatabaseAuthenticationEnabled as iamDatabaseAuthenticationEnabled, d.multiAZ as multiAZ
      `
    );

    return datastores.map((r) => resultToResource(r, "datastore"));
  }
}
