import type { GramConfiguration } from "@gram/core/dist/config/GramConfiguration";
import { defaultConfig } from "./default";
import { HSFContextProvider } from "@gram/klarna";
import { ThreatsaurusSuggestionSource } from "@gram/threatsaurus";

export const stagingConfig: GramConfiguration = {
  ...defaultConfig,

  // Update this to your domain
  origin: "https://gram-eu.staging.c2c.klarna.net",

  sentryDSN:
    "https://7755cd2515424f6cbcef6a4d43e54fdb@o24547.ingest.sentry.io/6023867",

  async bootstrapProviders(dal) {
    const providers = await defaultConfig.bootstrapProviders(dal);

    const hsf = {
      bucket: "secdev-qliksense-exporter-production-source",
      key: "hsf-systems-daily.csv",
      awsRole:
        "arn:aws:iam::715798949107:role/iam-sync/gram/c2c/gram/eu/production/gram.c2c_gram",
      awsExternalId: "e2105a81-0156-4321-b757-4e3f20aaacac",
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
