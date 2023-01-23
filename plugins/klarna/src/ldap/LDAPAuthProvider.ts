import config from "config";
import { Role } from "gram-api/src/auth/models/Role";
import { UserToken } from "gram-api/src/auth/models/UserToken";
import { AuthProvider } from "gram-api/src/auth/AuthProvider";
import basicAuth from "basic-auth";
import {
  InvalidInputError,
  NotAuthenticatedError,
} from "gram-api/src/util/errors";
import { AuthzError } from "gram-api/src/auth/AuthzError";
import { getLogger } from "gram-api/src/logger";
import { getLDAPUserGroupsByDN, initLdapClient } from "./lookup";
import { RequestContext } from "gram-api/src/data/providers/RequestContext";

const log = getLogger("LDAPAuthProvider");

const requiredGroup = config.get<string>(
  "auth.providerOpts.ldap.requiredGroup"
);

const pattern = new RegExp(`^sys\\.[a-z\\.\\-]+$`);

export default class LDAPAuthProvider implements AuthProvider {
  key = "ldap";

  async params() {
    return {};
  }

  async getIdentity(ctx: RequestContext): Promise<UserToken> {
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

    return new Promise((resolve, reject) => {
      if (!ldap) {
        reject(new Error("LDAP client not initialized yet!"));
        return;
      }

      const dn = `uid=${name},ou=People,dc=internal,dc=machines`;
      ldap.bind(dn, pass, async (err, user) => {
        if (err) {
          log.error("Ldap authentication failed", err);
          ldap.unbind();
          return reject(
            new NotAuthenticatedError(
              `authentication failed for ldap user ${name}`
            )
          );
        }

        const sub = name;
        const groups = await getLDAPUserGroupsByDN(dn);

        if (!groups.includes(requiredGroup)) {
          return reject(
            new AuthzError(
              `authorization failed for ldap user ${name}. User not member of ${requiredGroup}`
            )
          );
        }
        ldap.unbind();
        resolve({
          sub,
          name: user.displayName,
          roles: [Role.User],
          teams: [],
        });
      });
    });
  }
}
