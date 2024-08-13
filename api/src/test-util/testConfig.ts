import { DefaultAuthzProvider } from "@gram/core/dist/auth/DefaultAuthzProvider.js";
import { DummyIdentityProvider } from "@gram/core/dist/auth/DummyIdentityProvider.js";
import { ExposedSecret } from "@gram/core/dist/config/ExposedSecret.js";
import type {
  GramConfiguration,
  Providers,
} from "@gram/core/dist/config/GramConfiguration.js";
import { ComponentClass } from "@gram/core/dist/data/component-classes/index.js";
import type { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import classes from "./classes.js";
import { testReviewerProvider } from "./sampleReviewer.js";
import { TestTeamProvider } from "./TestTeamProvider.js";
import { testUserProvider } from "./sampleUser.js";
import { testSystemProvider } from "./system.js";
import { StaticValidationProvider } from "@gram/config/dist/providers/static/StaticValidationProvider.js";

/**
 * I don't know why this exists when there is a core/testConfig.ts. Might be worth trying to move all test-utility stuff there instead.
 */

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
    frameAncestors: [],
  },

  menu: [
    {
      name: "Github",
      path: "https://github.com/klarna-incubator/gram",
    },
  ],

  attributes: {
    flow: [
      {
        key: "protocols",
        type: "select",
        defaultValue: [],
        label: "Protocol(s)",
        options: [
          "HTTP",
          "HTTPS",
          "FTP",
          "SSH",
          "SMTP",
          "POP3",
          "IMAP",
          "DNS",
          "LDAP",
          "SMB",
          "gRPC",
          "MQTT",
          "AMQP",
        ],
        allowCustomValue: true,
        allowMultiple: true,
        optional: false,
      },
      {
        key: "authentication",
        type: "select",
        defaultValue: [],
        label: "Authentication",
        options: ["Basic Auth", "JWT", "OIDC"],
        allowCustomValue: true,
        allowMultiple: true,
        optional: false,
      },
      {
        key: "data_type",
        type: "select",
        defaultValue: [],
        label: "Type of Data",
        options: ["Personal Information", "Transaction Data"],
        allowCustomValue: true,
        allowMultiple: true,
        optional: false,
      },
      {
        key: "description",
        type: "text",
        defaultValue: "",
        label: "Description",
        multiline: true,
        optional: false,
      },
    ],
  },

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
      authzProvider: new DefaultAuthzProvider(dal),
      userProvider: testUserProvider,
      systemProvider: testSystemProvider,
      suggestionSources: [],
      teamProvider: new TestTeamProvider(),
      validationProviders: [new StaticValidationProvider()],
    };
  },
};
