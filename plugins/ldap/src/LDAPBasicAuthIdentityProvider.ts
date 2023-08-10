import {
  IdentityProvider,
  IdentityProviderParams,
  LoginResult,
} from "@gram/core/dist/auth/IdentityProvider";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { InvalidInputError } from "@gram/core/dist/util/errors";
import basicAuth from "basic-auth";
import { initLdapClient } from "./lookup";
import { getLogger } from "log4js";
import { LDAPClientSettings } from "./LDAPClientSettings";

const log = getLogger("LDAPAuthProvider");

/**
 * This identity provider uses basic auth to authenticate users against an LDAP server.
 *
 * It is configured with a required group, and will only allow users to login if they are a member of that group.
 * This provider is not yet made to work with a frontend, and will not be shown in the frontend.
 */
export class LDAPBasicAuthIdentityProvider implements IdentityProvider {
  key = "ldap";

  /**
   *
   * @param DNforUsername should be a function that formats a username into a DN for use in an LDAP bind.
   * e.g. (name) => `uid=${name},ou=Users`;
   */
  constructor(
    private ldapSettings: LDAPClientSettings,
    private DNforUsername: (username: string) => string
  ) {}

  async params(): Promise<IdentityProviderParams> {
    return { hideOnFrontend: true, key: this.key };
  }

  async getIdentity(ctx: RequestContext): Promise<LoginResult> {
    const authString =
      <string>ctx.currentRequest?.headers["authorization"] || "no-auth";
    if (!authString) throw new Error("missing authorization header");

    const parsed = basicAuth.parse(authString);
    if (!parsed) {
      throw new InvalidInputError(
        "Invalid Authorization Header. LDAP Authentication uses basic auth in the authorization header."
      );
    }
    const { name, pass } = parsed;

    const ldap = await initLdapClient(this.ldapSettings);

    const dn = this.DNforUsername(name);

    try {
      await ldap.bind(dn, pass);
    } catch (err) {
      log.error("Ldap authentication failed", err);

      return {
        status: "error",
        message: `authentication failed for ldap user ${name}. Bind failed.`,
      };
    } finally {
      ldap.unbind();
    }

    return {
      status: "ok",
      identity: {
        sub: name,
      },
    };
  }
}
