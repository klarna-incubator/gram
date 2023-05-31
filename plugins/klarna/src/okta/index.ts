import { AuthProvider, LoginResult } from "@gram/core/dist/auth/AuthProvider";
import { Role } from "@gram/core/dist/auth/models/Role";
import { lookupUser } from "@gram/core/dist/auth/user";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { getLogger } from "@gram/core/dist/logger";
import { InvalidInputError } from "@gram/core/dist/util/errors";
import config from "config";
import { getLDAPUserGroups } from "../ldap/lookup";

import secrets from "@gram/core/dist/secrets";
import { HttpsProxyAgent } from "hpagent";
import { Client, custom, generators, Issuer } from "openid-client";
import { aes256gcm } from "./util";

const log = getLogger("oktaAuth");

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

  roles.push(Role.User); // Initial access is controlled by Okta/sso-prod groups

  log.debug("Assigned roles:", roles);

  return roles;
}

const origin = config.get("origin") as string;

export default class OktaAuthProvider implements AuthProvider {
  key = "okta";
  issuer?: Issuer;
  client?: Client;
  redirectUrl: string;

  constructor() {
    this.redirectUrl = `${origin}/login/callback/okta`;

    if (process.env.HTTPS_PROXY) {
      const agent = new HttpsProxyAgent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 256,
        maxFreeSockets: 256,
        scheduling: "lifo",
        proxy: process.env.HTTPS_PROXY,
      });
      custom.setHttpOptionsDefaults({ agent });
    }

    this.discover();
  }

  async discover() {
    const url = config.get("auth.providerOpts.oidc.discoverUrl") as string;
    this.issuer = await Issuer.discover(url);
    log.info(
      "Discovered issuer %s %O",
      this.issuer.issuer,
      this.issuer.metadata
    );

    this.client = new this.issuer.Client({
      client_id: config.get("auth.providerOpts.oidc.clientId"),
      client_secret: config.get("auth.providerOpts.oidc.clientSecret"),
      redirect_uris: [this.redirectUrl],
      response_types: ["code"],
    });
  }

  /**
   * Non-secret parameters needed by the client.
   */
  async params(ctx: RequestContext) {
    if (!this.client) {
      log.warn("OIDC client not ready yet");
      return { hideOnFrontend: false };
    }

    const code_verifier = generators.codeVerifier();
    // store the code_verifier in your framework's session mechanism, if it is a cookie based solution
    // it should be httpOnly (not readable by javascript) and encrypted.

    const code_challenge = generators.codeChallenge(code_verifier);
    const state = generators.state();

    const redirectUrl = this.client.authorizationUrl({
      scope: "openid email profile groups",
      // resource: origin,
      code_challenge,
      response_type: "code",
      code_challenge_method: "S256",
      state,
    });

    const key = await secrets.get("auth.providerOpts.oidc.sessionSecret");
    ctx.currentRequest?.res?.cookie(
      "oidc-code",
      aes256gcm(key)
        .encrypt(JSON.stringify({ state, code_verifier }))
        .join("."),
      {
        httpOnly: true,
        sameSite: "strict",
      }
    );

    return {
      redirectUrl,
      hideOnFrontend: false,
    };
  }

  /**
   * @param {object} headers
   */
  async getIdentity(ctx: RequestContext): Promise<LoginResult> {
    if (!this.client) {
      log.warn("OIDC client not ready yet");
      throw new InvalidInputError("OIDC client not ready yet");
    }

    if (!ctx.currentRequest) {
      throw new Error("Request is undefined or null");
    }

    const key = await secrets.get("auth.providerOpts.oidc.sessionSecret");
    const [ct, iv, authTag] =
      ctx.currentRequest.cookies["oidc-code"].split(".");
    // TODO: make oidc security parameters configurable, since different providers want different things.
    const { code_verifier, state } = JSON.parse(
      aes256gcm(key).decrypt(ct, iv, authTag)
    );

    // Clear cookie after use
    ctx.currentRequest?.res?.clearCookie("oidc-code");

    const params = this.client.callbackParams(ctx.currentRequest);
    let tokenSet: any;

    try {
      tokenSet = await this.client.callback(this.redirectUrl, params, {
        code_verifier,
        state,
      });
    } catch (error: any) {
      let message = error.toString();
      if (error?.error === "invalid_grant") {
        message = "Login link expired. Try again.";
      }
      return {
        status: "error",
        message,
      };
    }

    const payload = await this.client.userinfo(tokenSet.access_token as string);

    if (!payload) {
      let message = `Okta error occured: ${decodeURIComponent(
        (ctx.currentRequest.query["error_description"] || "")?.toString()
      )}`;

      if (
        ctx.currentRequest.query["error_description"] ===
        "User+is+not+assigned+to+the+client+application."
      ) {
        message =
          "You are missing the required access group for Gram. See https://kep.klarna.net/docs/secure-development/threat_modeling/gram/#getting-access-to-gram";
      }

      return {
        status: "error",
        message,
      };
    }

    const email = payload.email;
    if (!payload.email_verified || !email || !email.endsWith("@klarna.com")) {
      log.warn(`Sign in was attempted with non-klarna email: ${email}`);
      return {
        status: "error",
        message: `only klarna employees allowed`,
      };
    }

    let groups: string[] = (payload.groups as string[]) || [];
    if (!groups || groups.length === 0) {
      log.warn(
        "Groups not part of userinfo payload, resorting to LDAP lookup instead"
      );
      groups = await getLDAPUserGroups(email);
    } else {
      log.info("Got groups from Okta - no ldap needed 🎉");
    }

    log.info(
      "User ldap groups",
      groups.filter((g) => g.startsWith("access.1288598"))
    );

    const user = await lookupUser(ctx, email);

    if (!user || user.teams === null || user.teams.length === 0) {
      return {
        status: "error",
        message: `LDAP lookup failed - no such user found for ${email}. Try again later.`,
      };
    }

    if (!groups || groups.length === 0) {
      return {
        status: "error",
        message: `LDAP lookup failed - group lookup for ${email} returned an empty result. Likely an LDAP issue. Try again later?`,
      };
    }

    const roles = getRoles(new Set(groups));

    if (!groups || groups.length === 0) {
      return {
        status: "error",
        message: `Login was successful, but no gram access groups have been assigned, so your user has no roles. Ping @joakim.uddholm if this happens, because it shouldn't :)`,
      };
    }

    return {
      status: "ok",
      token: {
        sub: email,
        name: payload.name,
        picture: payload.picture,
        provider: "okta",
        roles,
        teams: user.teams,
        slackId: user.slackId,
      },
    };
  }
}
