import { MagicLinkIdentityProvider } from "./MagicLinkIdentityProvider";
import { MagicLinkEmail } from "./notifications/magic-link";
import { Migration } from "@gram/core/dist/data/Migration";
import path from "path";

const MagicLinkMigrations = new Migration(
  path.join(__dirname, "..", "migrations"),
  "magic-link"
);

export { MagicLinkIdentityProvider, MagicLinkEmail, MagicLinkMigrations };
