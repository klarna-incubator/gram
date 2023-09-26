import {
  IdentityProvider,
  IdentityProviderParams,
  LoginResult,
} from "@gram/core/dist/auth/IdentityProvider";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { InvalidInputError } from "@gram/core/dist/util/errors";
import { getLogger } from "log4js";
import { HttpsProxyAgent } from "hpagent";
import { Client, custom, generators, Issuer } from "openid-client";
import { aes256gcm } from "./util";
import { Secret } from "@gram/core/dist/config/Secret";
import { config } from "@gram/core/dist/config";

const log = getLogger("OIDCIdentityProvider");

export class OIDCIdentityProvider implements IdentityProvider {
  key = "oidc";
  issuer?: Issuer;
  client?: Client;
  redirectUrl: string;
  sessionCryptoKey: string = "";

  constructor(
    private discoverUrl: string,
    private clientId: Secret,
    private clientSecret: Secret,
    private sessionSecret: Secret,
    private fieldForIdentitySub: string = "sub"
  ) {
    this.redirectUrl = `${config.origin}/login/callback/oidc`;

    if (config.httpsProxy) {
      const agent = new HttpsProxyAgent({
        keepAlive: true,
        keepAliveMsecs: 1000,
        maxSockets: 256,
        maxFreeSockets: 256,
        scheduling: "lifo",
        proxy: config.httpsProxy,
      });
      custom.setHttpOptionsDefaults({ agent });
    }

    this.discover();
  }

  async discover() {
    this.issuer = await Issuer.discover(this.discoverUrl);
    log.info(
      "Discovered issuer %s %O",
      this.issuer.issuer,
      this.issuer.metadata
    );

    const clientId = await this.clientId.getValue();

    if (!clientId) {
      throw new Error("clientId cannot be undefined");
    }

    const clientSecret = await this.clientSecret.getValue();

    if (!clientSecret) {
      throw new Error("clientSecret cannot be undefined");
    }

    this.client = new this.issuer.Client({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uris: [this.redirectUrl],
      response_types: ["code"],
    });

    const key = await this.sessionSecret.getValue();
    if (!key) {
      throw new Error("No session secret configured for OIDC Auth Provider");
    }
    this.sessionCryptoKey = key;
  }

  /**
   * Non-secret parameters needed by the client.
   */
  async params(ctx: RequestContext): Promise<IdentityProviderParams> {
    if (!this.client) {
      log.warn("OIDC client not ready yet");
      return { key: this.key, hideOnFrontend: true };
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

    ctx.currentRequest?.res?.cookie(
      "oidc-code",
      aes256gcm(this.sessionCryptoKey)
        .encrypt(JSON.stringify({ state, code_verifier }))
        .join("."),
      {
        httpOnly: true,
        sameSite: "strict",
      }
    );

    return {
      key: this.key,
      form: {
        type: "redirect",
        httpMethod: "POST",
        redirectUrl,
      },
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

    const [ct, iv, authTag] =
      ctx.currentRequest.cookies["oidc-code"].split(".");
    // TODO: make oidc security parameters configurable, since different providers want different things.
    const { code_verifier, state } = JSON.parse(
      aes256gcm(this.sessionCryptoKey).decrypt(ct, iv, authTag)
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
      let message = `OIDC error occured: ${decodeURIComponent(
        (ctx.currentRequest.query["error_description"] || "")?.toString()
      )}`;

      return {
        status: "error",
        message,
      };
    }

    return {
      status: "ok",
      identity: {
        sub: payload[this.fieldForIdentitySub] as string,
      },
    };
  }
}
