import type {
  GramConfiguration,
  Providers,
} from "../config/GramConfiguration.js";
import { ExposedSecret } from "../config/ExposedSecret.js";
import type { DataAccessLayer } from "../data/dal.js";
import { DummyReviewerProvider } from "../data/reviews/ReviewerHandler.js";
import { DummyUserProvider } from "../auth/UserHandler.js";
import { DummySystemProvider } from "../data/systems/DummySystemProvider.js";
import { DummyIdentityProvider } from "../auth/DummyIdentityProvider.js";
import { DummyAuthzProvider } from "../auth/DummyAuthzProvider.js";
import { DummyActionItemExporter } from "../action-items/DummyActionItemExporter.js";

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
    return {
      assetFolders: [],
      componentClasses: [],
      identityProviders: [new DummyIdentityProvider()],
      reviewerProvider: new DummyReviewerProvider(),
      authzProvider: new DummyAuthzProvider(),
      userProvider: new DummyUserProvider(),
      systemProvider: new DummySystemProvider(),
      suggestionSources: [],
      actionItemExporters: [new DummyActionItemExporter()],
      validationSources: [],
    };
  },
};
