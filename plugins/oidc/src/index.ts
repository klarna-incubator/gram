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
import { createRemoteJWKSet, jwtVerify } from "jose";
import { aes256gcm, encryptWithPublicKeyString } from "./util.js";

const log = log4js.getLogger("OIDCIdentityProvider");

export class OIDCIdentityProvider implements IdentityProvider {
  issuer?: Issuer;
  client?: Client;
  redirectUrl: string;
  sessionCryptoKey: string = "";

  // Lazily-built remote JWKS + resolved issuer used to validate presented
  // bearer tokens (the machine-to-machine, non-interactive path).
  private bearerJwks?: ReturnType<typeof createRemoteJWKSet>;
  private bearerIssuer?: string;

  constructor(
    private discoverUrl: string | Secret,
    private clientId: Secret,
    private clientSecret: Secret,
    private sessionSecret: Secret,
    private fieldForIdentitySub: string = "sub",
    public key: string = "oidc",
    /**
     * Accepted audiences for presented bearer tokens — the audience of the
     * authorization server that mints them (e.g. `api://kepcli`). An empty list
     * disables bearer-token auth. NOTE: this audience is shared by every app on
     * that authorization server, so it does NOT by itself pin the token to Gram
     * — the per-app gate is the client-id check below (`bearerClientId`).
     */
    private bearerAudiences: string[] = [],
    /**
     * Issuer/discovery URL for the bearer-token path (e.g. the authorization
     * server `https://sso.klarna.net/oauth2/<authServer>`). When undefined,
     * falls back to this provider's own login issuer.
     */
    private bearerIssuerUrl?: string | Secret,
    /**
     * Expected client id for the bearer-token (machine-to-machine) path — the
     * presented token's `cid`/`azp` claim MUST match this. The M2M app may be a
     * DIFFERENT Okta app than the interactive-login app, so this is configured
     * separately. When undefined, falls back to this provider's login
     * `clientId` (the `OIDC_CLIENT_ID` secret) for backward compatibility.
     */
    private bearerClientId?: string | Secret
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
    log.info("Discovered issuer:", {
      payload: {
        issuer: this.issuer.issuer,
        metadata: this.issuer.metadata,
      },
    });

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
      scope: "openid email profile",
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
      log.error(
        "Cookies object is undefined - cookie-parser middleware may not be configured"
      );

      // Try to get cookie from headers directly as fallback
      const cookieHeader = ctx.currentRequest.headers?.cookie;
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader
            .split(";")
            .map((cookie) => cookie.trim().split("="))
            .map(([key, value]) => [key, decodeURIComponent(value)])
        );

        if (cookies["oidc-code"]) {
          ctx.currentRequest.cookies = cookies;
        } else {
          throw new Error("oidc-code cookie not found in headers");
        }
      } else {
        throw new Error(
          "No cookies found in request. Ensure cookie-parser middleware is configured."
        );
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
      // log.info(
      //   "access_token",
      //   encryptWithPublicKeyString(JSON.stringify(tokenSet.access_token))
      // );
      // log.info(
      //   "id_token",
      //   encryptWithPublicKeyString(JSON.stringify(tokenSet.id_token))
      // );
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

  /**
   * Lazily discover the bearer-token issuer and build a cached remote JWKS set
   * from its `jwks_uri`. Falls back to this provider's login issuer when no
   * dedicated bearer issuer URL is configured.
   */
  private async getBearerKeys(): Promise<{
    jwks: ReturnType<typeof createRemoteJWKSet>;
    issuer: string;
  }> {
    if (this.bearerJwks && this.bearerIssuer) {
      log.debug("Reusing cached bearer JWKS", {
        payload: { issuer: this.bearerIssuer },
      });
      return { jwks: this.bearerJwks, issuer: this.bearerIssuer };
    }

    let issuer = this.issuer;

    const configuredUrl =
      typeof this.bearerIssuerUrl === "string"
        ? this.bearerIssuerUrl
        : await this.bearerIssuerUrl?.getValue();

    log.debug("Resolving bearer-token issuer", {
      payload: {
        source: configuredUrl ? "configured" : "loginIssuerFallback",
        url: configuredUrl,
      },
    });

    if (configuredUrl) {
      issuer = await Issuer.discover(configuredUrl);
    }

    if (!issuer || !issuer.metadata.jwks_uri || !issuer.metadata.issuer) {
      throw new Error(
        "Bearer-token issuer not discovered or missing jwks_uri/issuer metadata"
      );
    }

    this.bearerJwks = createRemoteJWKSet(new URL(issuer.metadata.jwks_uri));
    this.bearerIssuer = issuer.metadata.issuer;

    log.debug("Built bearer JWKS", {
      payload: {
        jwksUri: issuer.metadata.jwks_uri,
        issuer: issuer.metadata.issuer,
      },
    });

    return { jwks: this.bearerJwks, issuer: this.bearerIssuer };
  }

  /**
   * Non-interactive path: validate a presented bearer access token (minted for
   * Gram's OIDC app via KEP CLI token exchange) and resolve it to an identity.
   * Verifies the RS256 signature against the issuer JWKS and checks issuer,
   * audience, and expiry/not-before (via `jwtVerify`), then pins the token to
   * Gram's own app via the client-id claim. This does NOT change how per-model
   * authorization works — the caller resolves roles/teams for the subject
   * exactly as the interactive login does.
   */
  async getIdentityFromToken(rawToken: string): Promise<LoginResult> {
    if (!this.bearerAudiences || this.bearerAudiences.length === 0) {
      log.debug("Bearer-token auth not enabled: no audiences configured");
      return {
        status: "error",
        message: "Bearer-token auth is not enabled for this provider",
      };
    }

    log.debug("Validating presented bearer token", {
      payload: { audiences: this.bearerAudiences },
    });

    let payload;
    try {
      const { jwks, issuer } = await this.getBearerKeys();
      ({ payload } = await jwtVerify(rawToken, jwks, {
        issuer,
        audience: this.bearerAudiences,
      }));
    } catch (error: any) {
      log.info("Bearer-token validation failed", {
        payload: { error: error?.message },
      });
      return { status: "error", message: "Invalid token" };
    }

    log.debug("Bearer token signature, issuer and audience valid", {
      payload: { iss: payload.iss, aud: payload.aud, exp: payload.exp },
    });

    // Per-app gate: the auth-server audience is shared by every app on the
    // server, so pin to Gram's own client id via the token's `cid`/`azp` claim.
    // The M2M app may differ from the interactive-login app, so use the
    // dedicated `bearerClientId` when configured, falling back to the login
    // `clientId` (the OIDC_CLIENT_ID secret) otherwise.
    const expectedClientId =
      (typeof this.bearerClientId === "string"
        ? this.bearerClientId
        : await this.bearerClientId?.getValue()) ??
      (await this.clientId.getValue());

    if (!expectedClientId) {
      log.warn(
        "Bearer-token auth has no client id configured; refusing to accept tokens"
      );
      return { status: "error", message: "Invalid token" };
    }

    const tokenClientId = (payload.cid ?? payload.azp) as string | undefined;
    if (tokenClientId !== expectedClientId) {
      log.warn("Bearer-token rejected: client id does not match Gram's app", {
        payload: { cid: tokenClientId },
      });
      return { status: "error", message: "Invalid token" };
    }

    log.debug("Bearer-token client id verified against Gram's app");

    const sub = (payload[this.fieldForIdentitySub] ?? payload.sub) as string;
    if (!sub) {
      log.warn("Bearer-token rejected: missing subject claim", {
        payload: { field: this.fieldForIdentitySub },
      });
      return { status: "error", message: "Token missing subject claim" };
    }

    log.debug("Bearer-token identity resolved", { payload: { sub } });
    return { status: "ok", identity: { sub } };
  }
}
