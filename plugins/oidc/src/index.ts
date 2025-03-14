import {
  IdentityProvider,
  IdentityProviderParams,
  LoginResult,
} from "@gram/core/dist/auth/IdentityProvider.js";
import { Secret } from "@gram/core/dist/config/Secret.js";
import { config } from "@gram/core/dist/config/index.js";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import { InvalidInputError } from "@gram/core/dist/util/errors.js";
import log4js from "log4js";
import { Client, Issuer, custom, generators } from "openid-client";
import { aes256gcm } from "./util.js";

const log = log4js.getLogger("OIDCIdentityProvider");

export class OIDCIdentityProvider implements IdentityProvider {
  issuer?: Issuer;
  client?: Client;
  redirectUrl: string;
  sessionCryptoKey: string = "";

  constructor(
    private discoverUrl: string | Secret,
    private clientId: Secret,
    private clientSecret: Secret,
    private sessionSecret: Secret,
    private fieldForIdentitySub: string = "sub",
    public key: string = "oidc"
  ) {
    this.redirectUrl = `${config.origin}/login/callback/${key}`;

    if (config.httpsProxy) {
      custom.setHttpOptionsDefaults({
        timeout: 10000,
      });
    }

    this.discover();
  }

  async discover() {
    let url =
      typeof this.discoverUrl === "string"
        ? this.discoverUrl
        : await this.discoverUrl.getValue();

    if (!url) {
      throw new Error("discoverUrl cannot be undefined");
    }

    this.issuer = await Issuer.discover(url);
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

    const cryptoKey = await this.sessionSecret.getValue();
    if (!cryptoKey) {
      throw new Error("No session secret configured for OIDC Auth Provider");
    }
    this.sessionCryptoKey = cryptoKey;
  }

  /**
   * Non-secret parameters needed by the client.
   */
  async params(ctx: RequestContext): Promise<IdentityProviderParams> {
    if (!this.client) {
      log.warn("OIDC client not ready yet");
      return { key: this.key };
    }

    const code_verifier = generators.codeVerifier();
    // store the code_verifier in your framework's session mechanism, if it is a cookie based solution
    // it should be httpOnly (not readable by javascript) and encrypted.

    const code_challenge = generators.codeChallenge(code_verifier);
    const state = generators.state();

    const frontendRedirectUrl = this.client.authorizationUrl({
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
        redirectUrl: frontendRedirectUrl,
      },
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

    // Check if cookies object exists
    if (!ctx.currentRequest.cookies) {
      log.error("Cookies object is undefined - cookie-parser middleware may not be configured");
      
      // Try to get cookie from headers directly as fallback
      const cookieHeader = ctx.currentRequest.headers?.cookie;
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split(';')
            .map(cookie => cookie.trim().split('='))
            .map(([key, value]) => [key, decodeURIComponent(value)])
        );
        
        if (cookies['oidc-code']) {
          ctx.currentRequest.cookies = cookies;
        } else {
          throw new Error("oidc-code cookie not found in headers");
        }
      } else {
        throw new Error("No cookies found in request. Ensure cookie-parser middleware is configured.");
      }
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
