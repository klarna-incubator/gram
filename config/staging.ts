import type { GramConfiguration } from "@gram/core/dist/config/GramConfiguration.js";
import { ThreatsaurusSuggestionSource } from "@gram/threatsaurus";
import { defaultConfig } from "./default.js";

export const stagingConfig: GramConfiguration = {
  ...defaultConfig,

  // Update this to your domain
  origin: "https://gram-eu.staging.c2c.klarna.net",

  sentryDSN:
    "https://7755cd2515424f6cbcef6a4d43e54fdb@o24547.ingest.sentry.io/6023867",

  httpsProxy: process.env.HTTPS_PROXY,

  async bootstrapProviders(dal) {
    const providers = await defaultConfig.bootstrapProviders(dal);

    const threatsaurus = new ThreatsaurusSuggestionSource(
      "https://threatsaurus-eu.staging.c2c.klarna.net/v1/"
    );

    providers.suggestionSources?.push(threatsaurus);

    return providers;
  },
};
