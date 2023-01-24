/**
 * Module to verify and extract identity from google ID token
 * @exports google
 */
import config from "config";
import { Role } from "gram-api/src/auth/models/Role";
import { AuthProvider } from "gram-api/src/auth/AuthProvider";
import { UserToken } from "gram-api/src/auth/models/UserToken";
import { lookupUser } from "gram-api/src/auth/user";
import { getLogger } from "gram-api/src/logger";
import {
  InvalidInputError,
  NotAuthenticatedError,
} from "gram-api/src/util/errors";
import { getLDAPUserGroups } from "../ldap/lookup";
import { RequestContext } from "gram-api/src/data/providers/RequestContext";

import { Client, Issuer, generators } from "openid-client";
import { aes256gcm } from "./util";
import secrets from "gram-api/src/secrets";

const log = getLogger("googleAuth");

/**
 * Statically determine roles. Based on ldap groups
 *
 * @param groups
 * @returns
 */
export function getRoles(groups: Set<string>) {
  const roles: Role[] = [];

  const roleMap = config.get<Map<string, string[]>>(
    "auth.providerOpts.ldap.roleMap"
  );
  if (roleMap.get(Role.Admin)?.find((r) => groups.has(r))) {
    roles.push(Role.Admin);
  }
  if (roleMap.get(Role.Reviewer)?.find((r) => groups.has(r))) {
    roles.push(Role.Reviewer);
  }
  // if (roleMap.get(Role.User)?.find((r) => groups.has(r))) {
  roles.push(Role.User); // For now, ensure all logged-in users get the User Role.
  // Later this will be enforced through EAP.
  // }
  log.debug("Assigned roles:", roles);

  return roles;
}

const origin = config.get("origin") as string;

export default class GoogleAuthProvider implements AuthProvider {
  key = "google";
  issuer?: Issuer;
  client?: Client;
  redirectUrl: string;

  constructor() {
    this.redirectUrl = `${origin}/login/callback/google`;
    console.log(this.redirectUrl);
    this.discover();
  }

  async discover() {
    this.issuer = await Issuer.discover("https://accounts.google.com");
    log.info(
      "Discovered issuer %s %O",
      this.issuer.issuer,
      this.issuer.metadata
    );

    this.client = new this.issuer.Client({
      client_id: config.get("auth.providerOpts.google.clientId"),
      client_secret: config.get("auth.providerOpts.google.clientSecret"),
      redirect_uris: [this.redirectUrl],
      response_types: ["code"],
      // id_token_signed_response_alg (default "RS256")
      // token_endpoint_auth_method (default "client_secret_basic")
    }); // => Client
  }

  /**
   * Non-secret parameters needed by the client.
   */
  async params(ctx: RequestContext) {
    if (!this.client) {
      log.warn("OIDC client not ready yet");
      return {};
    }

    const code_verifier = generators.codeVerifier();
    // store the code_verifier in your framework's session mechanism, if it is a cookie based solution
    // it should be httpOnly (not readable by javascript) and encrypted.

    const code_challenge = generators.codeChallenge(code_verifier);

    const redirectUrl = this.client.authorizationUrl({
      scope: "openid email profile",
      // resource: origin,
      code_challenge,
      response_type: "code",
      code_challenge_method: "S256",
    });

    const key = await secrets.get("auth.oidcSessionSecret");
    ctx.currentRequest?.res?.cookie(
      "oidc-code",
      aes256gcm(key).encrypt(code_verifier).join("."),
      {
        httpOnly: true,
        sameSite: "strict",
      }
    );

    return {
      redirectUrl,
    };
  }

  /**
   * @param {object} headers
   */
  async getIdentity(ctx: RequestContext): Promise<UserToken> {
    if (!this.client) {
      log.warn("OIDC client not ready yet");
      throw new InvalidInputError("OIDC client not ready yet");
    }

    if (!ctx.currentRequest) {
      throw new Error("Request is undefined or null");
    }

    const key = await secrets.get("auth.oidcSessionSecret");
    const [ct, iv, authTag] =
      ctx.currentRequest.cookies["oidc-code"].split(".");
    const code_verifier = aes256gcm(key).decrypt(ct, iv, authTag);

    const params = this.client.callbackParams(ctx.currentRequest);
    const tokenSet = await this.client.callback(this.redirectUrl, params, {
      code_verifier,
    });
    const payload = await this.client.userinfo(tokenSet.access_token as string);

    if (!payload) {
      throw new NotAuthenticatedError("verification of token failed");
    }

    const email = payload.email;
    if (!payload.email_verified || !email || !email.endsWith("@klarna.com")) {
      log.warn(`Sign in was attempted with non-klarna email: ${email}`);
      throw new NotAuthenticatedError("only klarna employees allowed");
    }

    const groups = await getLDAPUserGroups(email);
    log.debug(
      "User ldap groups",
      groups.filter((g) => g.startsWith("access.1288598"))
    );

    const user = await lookupUser(ctx, email);

    if (!user || user.teams === null || user.teams.length === 0) {
      throw new NotAuthenticatedError(`no such user found for ${email}`);
    }

    return {
      sub: email,
      name: payload.name,
      picture: payload.picture,
      provider: "google",
      roles: getRoles(new Set(groups)),
      teams: user.teams,
      slackId: user.slackId,
    };
  }
}
