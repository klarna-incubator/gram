import { AuthProvider, LoginResult } from "@gram/core/dist/auth/AuthProvider";
import { Role } from "@gram/core/dist/auth/models/Role";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { getLogger } from "@gram/core/dist/logger";
import {
  InvalidInputError,
  NotAuthenticatedError,
} from "@gram/core/dist/util/errors";
import basicAuth from "basic-auth";
import config from "config";
import { getLDAPUserGroupsByDN, initLdapClient } from "./lookup";

const log = getLogger("LDAPAuthProvider");

const requiredGroup = config.get<string>(
  "auth.providerOpts.ldap.requiredGroup"
);

const pattern = new RegExp(`^sys\\.[a-z\\.\\-]+$`);

export default class LDAPAuthProvider implements AuthProvider {
  key = "ldap";

  async params() {
    return { hideOnFrontend: true };
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

    if (!pattern.test(name)) {
      throw new NotAuthenticatedError(
        `Invalid system user used for login. Expects sys.example, got ${name}`
      );
    }

    const ldap = await initLdapClient();

    const dn = `uid=${name},ou=People,dc=internal,dc=machines`;
    try {
      await ldap.bind(dn, pass);
    } catch (err) {
      log.error("Ldap authentication failed", err);

      return {
        status: "error",
        message: `authentication failed for ldap user ${name}. Bind failed. ${err}. ${err.message}`,
      };
    } finally {
      ldap.unbind();
    }

    const sub = name;
    const groups = await getLDAPUserGroupsByDN(dn);

    if (!groups.includes(requiredGroup)) {
      return {
        status: "error",
        message: `authorization failed for ldap user ${name}. User not member of ${requiredGroup}`,
      };
    }

    return {
      status: "ok",
      token: {
        sub,
        name: sub,
        roles: [Role.User],
        teams: [],
      },
    };
  }
}
