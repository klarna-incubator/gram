import {
  IdentityProvider,
  IdentityProviderParams,
  LoginResult,
} from "@gram/core/dist/auth/IdentityProvider.js";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import { InvalidInputError } from "@gram/core/dist/util/errors.js";
import basicAuth from "basic-auth";
import { initLdapClient } from "./lookup.js";
import pkg from "log4js";
const { getLogger } = pkg;
import { LDAPClientSettings } from "./LDAPClientSettings.js";

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
   * @param DNForUsername should be a function that formats a username into a DN for use in an LDAP bind.
   * e.g. (name) => `uid=${name},ou=Users`;
   * @param SubForUsername optional function to map username to a different sub (id). Use this if your user lookup
   * uses a different attribute.
   */
  constructor(
    private ldapSettings: LDAPClientSettings,
    private DNForUsername: (username: string) => string,
    private SubForUsername: (username: string) => string = (username) =>
      username
  ) {}

  async params(): Promise<IdentityProviderParams> {
    return { key: this.key };
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

    const dn = this.DNForUsername(name);

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
        sub: this.SubForUsername(name),
      },
    };
  }
}
