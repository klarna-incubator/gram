import type { GramConfiguration } from "@gram/core/dist/config/GramConfiguration.js";
import { ThreatsaurusSuggestionSource } from "@gram/threatsaurus";
import { defaultConfig } from "./default.js";
import { EnvSecret } from "@gram/core/dist/config/EnvSecret.js";

export const stagingConfig: GramConfiguration = {
  ...defaultConfig,

  // Update this to your domain
  origin: "https://gram-eu.staging.c2c.klarna.net",

  sentryDSN:
    "https://7755cd2515424f6cbcef6a4d43e54fdb@o24547.ingest.sentry.io/6023867",

  httpsProxy: process.env.HTTPS_PROXY,

  notifications: {
    providers: {
      email: {
        host: new EnvSecret("EMAIL_HOST"),
        port: new EnvSecret("EMAIL_PORT"),
        password: new EnvSecret("EMAIL_PASSWORD"),
        user: new EnvSecret("EMAIL_USER"),
        overrideRecipient: "secure-development@klarna.com",
        senderName: "[Staging] Gram",
      },
    },
  },

  async bootstrapProviders(dal) {
    const providers = await defaultConfig.bootstrapProviders(dal);

    const threatsaurus = new ThreatsaurusSuggestionSource(
      "https://threatsaurus-eu.staging.c2c.klarna.net/v1/"
    );

    providers.suggestionSources?.push(threatsaurus);

    return providers;
  },
};
