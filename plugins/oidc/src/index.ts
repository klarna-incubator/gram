import { Migration } from "@gram/core/dist/data/Migration.js";
import path from "path";
import * as url from "url";

const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

// Create OIDC migrations object
const OIDCMigrations = new Migration(
  path.join(__dirname, "..", "migrations"),
  "oidc"
);

// Export all OIDC providers and their types
export { OIDCIdentityProvider } from "./OIDCIdentityProvider.js";
export { OIDCGroupBasedAuthzProvider } from "./OIDCGroupBasedAuthzProvider.js";
export { OIDCUserProvider } from "./OIDCUserProvider.js";
export { OIDCTeamProvider } from "./OIDCTeamProvider.js";
export { OIDCGroupBasedReviewerProvider } from "./OIDCGroupBasedReviewerProvider.js";
export { OIDCUserStore } from "./OIDCUserStore.js";
export { OIDCMigrations };

// Export types
export type { OIDCUserInfo } from "./OIDCUserStore.js";
export type { OIDCAuthzProviderSettings } from "./OIDCGroupBasedAuthzProvider.js";
export type { OIDCUserProviderSettings } from "./OIDCUserProvider.js";
export type { OIDCTeamProviderSettings } from "./OIDCTeamProvider.js";
export type { OIDCReviewerProviderSettings } from "./OIDCGroupBasedReviewerProvider.js";
