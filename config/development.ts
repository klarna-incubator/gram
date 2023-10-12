import type { GramConfiguration } from "@gram/core/dist/config/GramConfiguration.js";
import { ExposedSecret } from "@gram/core/dist/config/ExposedSecret.js";
import { defaultConfig } from "./default.js";

export const developmentConfig: GramConfiguration = {
  ...defaultConfig,

  jwt: {
    ttl: 86400,
    secret: {
      auth: new ExposedSecret(
        "6bc84cf7f80d675d3cefb81bb69247a5feb7a4ed8471bfdf8163753fac5197ea8d088bc88ad98b938375213576e7b06859b036e27cffccf700773e4ec66d243f"
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
    providers: {
      email: {
        host: new ExposedSecret(""),
        port: new ExposedSecret("25"),
        password: new ExposedSecret(""),
        user: new ExposedSecret(""),
        // overrideRecipient: "your-email"
        // senderName: "[Development] Gram",
      },
    },
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
};
