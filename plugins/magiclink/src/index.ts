import { MagicLinkIdentityProvider } from "./MagicLinkIdentityProvider.js";
import { MagicLinkEmail } from "./notifications/magic-link.js";
import { Migration } from "@gram/core/dist/data/Migration.js";
import path from "path";
import * as url from "url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

const MagicLinkMigrations = new Migration(
  path.join(__dirname, "..", "migrations"),
  "magic-link"
);

export { MagicLinkIdentityProvider, MagicLinkEmail, MagicLinkMigrations };
