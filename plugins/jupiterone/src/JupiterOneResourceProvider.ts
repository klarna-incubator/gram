import {
  Resource,
  ResourceProvider,
} from "@gram/core/dist/resources/ResourceHandler.js";
import { JupiterOneClientFactory } from "./client.js";
import { sanitizeJ1QueryParam } from "./util.js";

const ID_PREFIX = "j1/";

function resultToExternalEntity(
  result: Record<string, any>,
  additionalAttributes: Record<string, any> = {}
): Resource {
  return {
    id: ID_PREFIX + result.key,
    type: "external entity",
    displayName: result.displayName,
    systemId: result.systemId,
    attributes: {
      ...formatAttributes({ ...additionalAttributes, ...result }),
    },
  };
}

function resultToDatastore(
  result: Record<string, any>,
  additionalAttributes: Record<string, any> = {}
): Resource {
  return {
    id: ID_PREFIX + result.arn,
    type: "datastore",
    displayName: result.displayName,
    systemId: result.systemId,
    attributes: {
      ...formatAttributes({
        ...additionalAttributes,
        dbType: result.dbType,
        encrypted: result.encrypted,
        arn: result.arn,
        ...result,
      }),
    },
  };
}

function formatAttributes(result: Record<string, any>): Record<string, any> {
  return Object.entries(result).reduce(
    (acc: Record<string, any>, [key, value]) => {
      if (!["key", "id", "displayName", "systemId"].includes(key)) {
        acc[formatKey(key)] = String(value);
      }
      return acc;
    },
    {}
  );
}
function formatKey(key: string): string {
  let formattedKey = key.replace(/([A-Z])/g, " $1").toLowerCase();
  formattedKey = formattedKey.charAt(0).toUpperCase() + formattedKey.slice(1);
  return formattedKey;
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
    RETURN system._key as key, system.displayName as displayName, system.systemId as systemId, system._type as systemType, 
    system.audienceClass as audienceClass, system.availabilityClass as availabilityClass, system.confidentialityClass as confidentialityClass, 
    system.integrityClass as integrityClass, system.lifecycleState as lifecycleState
      `
    );

    let dependingSystems = dependingSystemResult.map((result) =>
      resultToExternalEntity(result, {
        relationship: "depending system",
      })
    );

    const dependencyResult = await j1Client.queryV1(
      `FIND UNIQUE KSystem as system 
    THAT DEPENDS << KSystem WITH systemId = '${sanitizeJ1QueryParam(systemId)}' 
    RETURN system._key as key, system.displayName as displayName, system.systemId as systemId, system._type as systemType, 
    system.audienceClass as audienceClass, system.availabilityClass as availabilityClass, system.confidentialityClass as confidentialityClass, 
    system.integrityClass as integrityClass, system.lifecycleState as lifecycleState
        `
    );

    let dependencySystems = dependencyResult.map((result) =>
      resultToExternalEntity(result, {
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
    THAT HAS DataStore WITH _type != 'aws_ebs_volume' as d 
    THAT OWNS << KSystem WITH systemId = '${sanitizeJ1QueryParam(
      systemId
    )}' as s 
    RETURN d._type as dbType, d._key as key, d.name as displayName, d.engine as engine, d.bucketName as bucketName, 
    d.region as region, d.encrypted as encrypted, d.hasBackup as hasBackup, d.continuousBackupEnabled as continuousBackupEnabled, 
    d.arn as arn, s.systemId as systemId, account.tag.environment as environment, d.iamDatabaseAuthenticationEnabled as iamDatabaseAuthenticationEnabled, d.multiAZ as multiAZ,
    account.name as accountName, d.accountId as accountId
      `
    );

    return datastores.map((r) => resultToDatastore(r));
  }
}
