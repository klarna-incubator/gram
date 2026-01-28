import axios from "axios";
import log4js from "log4js";
import {
  WBK,
  InstanceConfig,
  minimizeSimplifiedSparqlResults,
  simplifySparqlResults,
  EntityId,
  simplifyClaims,
  SimplifiedClaims,
} from "wikibase-sdk";

const wbkConfig: InstanceConfig = {
  instance: "https://knowledgegraph.klarna.net",
  sparqlEndpoint: "https://pinkbase-proxy-eu.production.c2c.klarna.net/sparql", // Required to use `sparqlQuery` and `getReverseClaims` functions, optional otherwise
};

const log = log4js.getLogger("WikibaseSdkClient");

export class WikibaseSdkClient {
  wbSdk: ReturnType<typeof WBK>;

  constructor() {
    this.wbSdk = WBK(wbkConfig);
  }

  async getItemDetails(
    itemQID: EntityId,
    properties: any[] = []
  ): Promise<any | null> {
    const url = this.wbSdk.getEntities({
      ids: itemQID,
      props: ["claims"],
    });

    log.debug(`Fetching item details for QID: ${itemQID} at URL: ${url}`);

    try {
      const response = await axios.get(url);

      const entityData = simplifyClaims(response.data.entities[itemQID].claims);

      if (!entityData) {
        log.debug(`No data found for item QID: ${itemQID}`);
        return null;
      }
      log.debug(`Fetched details for item QID: ${itemQID}`);

      if (properties && properties.length > 0) {
        const filteredData: any = {};
        for (const prop of properties) {
          if (entityData[prop]) {
            filteredData[prop] = entityData[prop];
          }
        }
        return filteredData as SimplifiedClaims;
      }
      return entityData;
    } catch (error) {
      log.warn("Error fetching item details:", error);
      throw error;
    }
  }

  async getUserQIDFromEmail(email: string) {
    const wdt = `${wbkConfig.instance}/prop/direct/`;

    const sparql = `
    PREFIX wdt: <${wdt}>
    SELECT ?item WHERE {
      ?item wdt:P53 ${JSON.stringify(email)} .
    }
    LIMIT 50
    `;
    const url = this.wbSdk.sparqlQuery(sparql);
    log.debug(`Searching for user with email: ${email} at URL: ${url}`);

    try {
      const response = await axios.get(url);

      const userQIDs = minimizeSimplifiedSparqlResults(
        simplifySparqlResults(response.data)
      );

      if (!userQIDs || userQIDs.length === 0) {
        log.debug(`No user found for email: ${email}`);
        return null;
      }

      if (userQIDs.length > 1) {
        log.debug(`Multiple users found for email: ${email}`);
        return null;
      }

      const userQid = userQIDs[0];
      log.debug(`Found user ID: ${userQid} for email: ${email}`);
      return userQid as EntityId;
    } catch (error) {
      log.warn("Error fetching user data:", error);
      throw error;
    }
  }

  async getItemQID(itemLabel: string) {
    const url = this.wbSdk.searchEntities({
      search: itemLabel,
    });

    log.debug(`Searching for item with label: ${itemLabel} at URL: ${url}`);

    try {
      const response = await axios.get(url);

      const searchData = response.data.search;

      if (searchData.length === 0) {
        log.warn(`No item found for label: ${itemLabel}`);
        return null;
      }
      if (searchData[0].length > 1) {
        log.warn(`Multiple items found for label: ${itemLabel}`);
        return null;
      }
      log.debug(`Found item ID: ${searchData[0].id} for label: ${itemLabel}`);
      return searchData[0].id;
    } catch (error) {
      log.warn("Error fetching item data:", error);
      throw error;
    }
  }

  async getUserQID(itemLabel: string) {
    const url = this.wbSdk.searchEntities({
      search: itemLabel,
    });

    log.debug(`Searching for user with label: ${itemLabel} at URL: ${url}`);

    try {
      const response = await axios.get(url);

      const searchData = response.data.search;

      if (searchData.length === 0) {
        log.warn(`No user found for label: ${itemLabel}`);
        return null;
      }
      if (searchData[0].length > 1) {
        log.warn(`Multiple users found for label: ${itemLabel}`);
        return null;
      }
      log.debug(`Found user ID: ${searchData[0].id} for label: ${itemLabel}`);
      return searchData[0].id;
    } catch (error) {
      log.warn("Error fetching user data:", error);
      throw error;
    }
  }

  async getUserOrgUnitQID(user: string) {
    const url = this.wbSdk.searchEntities({
      search: `${user}`,
    });
  }

  async getSystemQID(systemId: string) {
    const url = this.wbSdk.searchEntities({
      search: `${systemId}`,
    });
    log.debug(`Searching for system with name: ${systemId} at URL: ${url}`);

    try {
      const response = await axios.get(url);

      const searchData = response.data.search;

      if (searchData.length === 0) {
        log.warn(`No entity found for system: ${systemId}`);
        return null;
      }
      const filteredData = searchData.filter((entity: any) => {
        return entity.display.label.value.includes("(System)");
      });

      if (filteredData.length === 0) {
        log.warn(`No entity found for system: ${systemId}`);
        return null;
      }

      const systemQid = filteredData[0].id;
      log.debug(`Found system QID: ${systemQid} for system: ${systemId}`);
      return systemQid;
    } catch (error) {
      log.warn("Error fetching system data:", error);
      throw error;
    }
  }

  async getOrgUnitQID(systemName: string) {
    const url = this.wbSdk.searchEntities({
      search: `${systemName} (Org Unit)`,
    });
    log.debug(`Searching for org unit with name: ${systemName} at URL: ${url}`);

    try {
      const response = await axios.get(url);

      const searchData = response.data.search;

      if (searchData.length === 0) {
        log.warn(`No entity found for org unit: ${systemName}`);
        return null;
      }
      const filteredData = searchData.filter((entity: any) => {
        return entity.display.label.value.includes("(Org Unit)");
      });

      if (filteredData.length === 0) {
        log.warn(`No entity found for org unit: ${systemName}`);
        return null;
      }

      const orgUnitQid = filteredData[0].id;
      log.debug(
        `Found org unit QID: ${orgUnitQid} for org unit: ${systemName}`
      );
      return orgUnitQid;
    } catch (error) {
      log.warn("Error fetching org unit data:", error);
      throw error;
    }
  }
}
