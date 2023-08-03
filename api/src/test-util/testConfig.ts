import { DefaultAuthzProvider } from "@gram/core/dist/auth/DefaultAuthzProvider";
import { DummyIdentityProvider } from "@gram/core/dist/auth/DummyIdentityProvider";
import { ExposedSecret } from "@gram/core/dist/config/ExposedSecret";
import type {
  GramConfiguration,
  Providers,
} from "@gram/core/dist/config/GramConfiguration";
import type { DataAccessLayer } from "@gram/core/dist/data/dal";
import { testReviewerProvider } from "./sampleReviewer";
import { testUserProvider } from "./sampleUser";
import { testSystemProvider } from "./system";
import { ComponentClass } from "core/dist/data/component-classes";
import classes from "./classes.json";

export const testConfig: GramConfiguration = {
  appPort: 8080,
  controlPort: 8081,
  origin: "http://localhost:4726",

  jwt: {
    ttl: 86400,
    secret: {
      auth: new ExposedSecret(
        "9d50b76032b147ea74596f68b4657e80e38f52fc6226b2f3a1479f58fdac8683"
      ),
    },
  },

  postgres: {
    host: new ExposedSecret("localhost"),
    user: new ExposedSecret("gram-test"),
    password: new ExposedSecret("somethingsecretfortesting"),
    database: new ExposedSecret("gram-test"),
    port: new ExposedSecret("5433"),
    ssl: false,
  },

  notifications: {
    providers: {
      email: {
        host: new ExposedSecret("nope"),
        port: new ExposedSecret("25"),
        password: new ExposedSecret("nope"),
        user: new ExposedSecret("nope"),
      },
    },
  },

  log: {
    layout: "json",
    level: "info",
    auditHttp: {
      excludeKeys: {
        header: ["authorization", "x-google-id-token", "cookie"],
        body: ["token"],
      },
      includeKeys: {
        header: ["user-agent", "host", "referer", "cache-control", "pragma"],
      },
      simplified: false,
    },
  },

  allowedSrc: {
    img: ["https:"],
    connect: [],
  },

  menu: [
    {
      name: "Github",
      path: "https://github.com/klarna-incubator/gram",
    },
  ],

  bootstrapProviders: async function (
    dal: DataAccessLayer
  ): Promise<Providers> {
    const toComponentClass = (o: any): ComponentClass => {
      return {
        id: o.id,
        name: o.name,
        icon: o.icon,
        componentType: o.componentType,
      };
    };

    // Disable suggestionEngine from listening on modelService events to stop Max EventEmitter complaints.
    // This will probably confuse the hell out of me in the future. Oh well.
    dal.suggestionEngine.noListen = true;

    return {
      assetFolders: [],
      componentClasses: classes.map(toComponentClass),
      identityProviders: [new DummyIdentityProvider()],
      reviewerProvider: testReviewerProvider,
      authzProvider: new DefaultAuthzProvider(),
      userProvider: testUserProvider,
      systemProvider: testSystemProvider,
      suggestionSources: [],
    };
  },
};
