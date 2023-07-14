import type { GramConfiguration } from "../core/dist/config/GramConfiguration";
import { defaultConfig } from "./default";
import { EnvSecret } from "./util/EnvSecret";
import { ExposedSecret } from "./util/ExposedNonProdSecret";

export const developmentConfig: GramConfiguration = {
  ...defaultConfig,

  jwt: {
    ttl: 86400,
    secret: {
      auth: new EnvSecret("AUTH_SECRET"),
    },
  },

  postgres: {
    host: new ExposedSecret("localhost"),
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

  // bootstrapProviders: function (
  //   dal: DataAccessLayer,
  //   app: Application
  // ): Promise<Providers> {
  //   throw new Error("Function not implemented.");
  // },
};
