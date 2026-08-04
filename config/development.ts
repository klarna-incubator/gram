import type { GramConfiguration } from "@gram/core/dist/config/GramConfiguration.js";
import { ExposedSecret } from "@gram/core/dist/config/ExposedSecret.js";
import { EmailNotificationProvider, emailProviderTemplates } from "@gram/email";
import { renderMagicLinkTemplate } from "@gram/magiclink";
import { defaultConfig } from "./default.js";
import { EnvSecret } from "@gram/core/dist/config/EnvSecret.js";

export const developmentConfig: GramConfiguration = {
  ...defaultConfig,

  jwt: {
    ttl: 86400,
    secret: {
      auth: new ExposedSecret(
        "6bc84cf7f80d675d3cefb81bb69247a5feb7a4ed8471bfdf8163753fac5197ea8d088bc88ad98b938375213576e7b06859b036e27cffccf700773e4ec66d243f",
      ),
    },
  },

  postgres: {
    host: new ExposedSecret("127.0.0.1"),
    user: new ExposedSecret("gram"),
    password: new ExposedSecret("somethingsecret"),
    database: new ExposedSecret("gram"),
    port: new ExposedSecret("5432"),
    ssl: false,
  },

  notifications: {
    ...defaultConfig.notifications,
  },

  log: {
    layout: "coloured",
    level: "debug",
    auditHttp: {
      excludeKeys: {
        header: ["authorization", "x-google-id-token", "cookie"],
        body: ["token"],
      },
      includeKeys: {
        header: ["user-agent", "host", "referer", "cache-control", "pragma"],
      },
      simplified: true,
    },
  },

  async bootstrapProviders(dal) {
    const providers = await defaultConfig.bootstrapProviders(dal);

    providers.notificationProviders = [
      new EmailNotificationProvider(
        {
          host: new EnvSecret("EMAIL_HOST"),
          port: new EnvSecret("EMAIL_PORT"),
          password: new EnvSecret("EMAIL_PASSWORD"),
          user: new EnvSecret("EMAIL_USER"),
          overrideRecipient: await new EnvSecret(
            "EMAIL_OVERRIDE_RECIPIENT",
          ).getValue(),
          senderName:
            (await new EnvSecret("EMAIL_SENDER_NAME").getValue()) ||
            "[Development] Gram",
        },
        {
          ...emailProviderTemplates,
          "magic-link": renderMagicLinkTemplate,
        },
        developmentConfig.notifications,
      ),
    ];

    return providers;
  },
};
