import { Secret } from "@gram/core/dist/config/Secret.js";
import {
  JupiterOneClient,
  JupiterOneClientOptions,
} from "@jupiterone/jupiterone-client-nodejs";
import log4js from "log4js";
import Cache from "@gram/core/dist/util/cache.js";
// import { config } from "@gram/core/dist/config/index.js";

const log = log4js.getLogger("OverloadedJupiterOneClient");

const ONE_HOUR_IN_MS = 1000 * 60 * 60;

export class OverloadedJupiterOneClient extends JupiterOneClient {
  constructor(options: JupiterOneClientOptions) {
    super(options);
  }

  queryCache: Cache<string, any> = new Cache<string, any>(
    "jupiterone-query",
    ONE_HOUR_IN_MS
  );

  async queryV1(query: string, params: any) {
    const cacheKey = query + JSON.stringify(params);
    const cachedResult = this.queryCache.get(cacheKey);
    if (cachedResult) {
      log.debug(
        "OverloadedJupiterOneClient.query",
        query,
        params,
        "(Cache hit)"
      );
      return cachedResult;
    }

    log.debug("OverloadedJupiterOneClient.query", query, params);
    const result = await super.queryV1(query, params);
    log.debug(
      "OverloadedJupiterOneClient.query",
      query,
      params,
      JSON.stringify(result, null, 2)
    );
    this.queryCache.set(cacheKey, result);
    return result;
  }
}

export async function createJ1Client(
  apiKey: Secret,
  account: string,
  apiBaseUrl: string
): Promise<OverloadedJupiterOneClient> {
  const accessToken = await apiKey.getValue();

  if (!accessToken) {
    throw new Error("JupiterOne API key is missing");
  }

  const options: JupiterOneClientOptions = {
    accessToken,
    apiBaseUrl, //: "https://api.eu.jupiterone.io",
    account,
  };
  const client = new OverloadedJupiterOneClient(options);
  await client.init();
  return client;
}
