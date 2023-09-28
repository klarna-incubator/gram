import { ClientOptions } from "ldapts";
import { Secret } from "@gram/core/dist/config/Secret.js";

export interface LDAPClientSettings {
  clientOptions: ClientOptions;
  /**
   * If the LDAP Server requires binding to perform searches, provide the bindDN and bindCredentials here.
   */
  bindOptions?: {
    bindDN: Secret;
    bindCredentials: Secret;
  };
}
