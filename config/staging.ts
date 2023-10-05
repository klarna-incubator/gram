import type { GramConfiguration } from "@gram/core/dist/config/GramConfiguration.js";
import { defaultConfig } from "./default.js";
import { HSFContextProvider } from "@gram/klarna";
import { ThreatsaurusSuggestionSource } from "@gram/threatsaurus";

export const stagingConfig: GramConfiguration = {
  ...defaultConfig,

  // Update this to your domain
  origin: "https://gram-eu.staging.c2c.klarna.net",

  sentryDSN:
    "https://7755cd2515424f6cbcef6a4d43e54fdb@o24547.ingest.sentry.io/6023867",

  httpsProxy: process.env.HTTPS_PROXY,

  async bootstrapProviders(dal) {
    const providers = await defaultConfig.bootstrapProviders(dal);

    const hsf = {
      bucket: "secdev-qliksense-exporter-staging-source",
      key: "hsf-systems-daily.csv",
      awsRole:
        "arn:aws:iam::422554941857:role/iam-sync/gram/c2c/gram/eu/staging/gram.c2c_gram",
      awsExternalId: "73fddbb9-a953-4f1c-9198-16a6113fe681",
    };

    const hsfProvider = new HSFContextProvider(
      hsf.bucket,
      hsf.key,
      hsf.awsRole,
      hsf.awsExternalId
    );

    providers.systemPropertyProviders?.push(hsfProvider);

    const threatsaurus = new ThreatsaurusSuggestionSource(
      "https://threatsaurus-eu.staging.c2c.klarna.net/v1/"
    );

    providers.suggestionSources?.push(threatsaurus);

    return providers;
  },
};
