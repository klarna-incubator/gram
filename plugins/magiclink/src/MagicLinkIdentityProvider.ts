import {
  IdentityProvider,
  IdentityProviderParams,
  LoginResult,
} from "@gram/core/dist/auth/IdentityProvider.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { linkTo } from "@gram/core/dist/util/links.js";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext.js";
import pg from "pg";
import log4js from "log4js";
import { randomUUID } from "crypto";

const log = log4js.getLogger("MagicLinkIdentityProvider");

export class MagicLinkIdentityProvider implements IdentityProvider {
  key: string = "magic-link";

  dal: DataAccessLayer;
  pool: pg.Pool;

  constructor(dal: DataAccessLayer, pluginPool: pg.Pool) {
    this.dal = dal;
    this.pool = pluginPool;
  }

  async params(ctx: RequestContext): Promise<IdentityProviderParams> {
    return {
      key: this.key,
      form: {
        type: "email",
        httpMethod: "POST",
      },
    };
  }

  async createToken(email: string): Promise<void> {
    const token = randomUUID();
    const url = linkTo(
      `/login/callback/magic-link?token=${encodeURIComponent(token)}`
    );
    log.debug(`Sending magic link to ${email} with link ${url}`);

    const query = `INSERT INTO magic_link_tokens (sub, token, expires_at) VALUES ($1, $2, $3)`;
    await this.pool.query(query, [
      email,
      token,
      new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
    ]);

    await this.dal.notificationService.queue({
      templateKey: "magic-link",
      params: {
        link: url,
        recipient: {
          sub: email,
          to: email,
        },
      },
    });
  }

  async getIdentity(ctx: RequestContext): Promise<LoginResult> {
    const { token, email } = ctx.currentRequest?.body;

    if (!token && !email) {
      return {
        status: "error",
        message: "Invalid input, need either email or token",
      };
    }

    // Got an email in the body, so it's requesting a new link. Probably.
    if (email) {
      await this.createToken(email);
      return {
        status: "info",
        message: "Check your inbox for an email containing a sign-in link",
      };
    }

    // Otherwise, we have a token
    const query = `SELECT sub, expires_at FROM magic_link_tokens WHERE token = $1`;
    const result = await this.pool.query(query, [token]);

    if (result.rowCount === 1) {
      const expiresAt = result.rows[0].expires_at;
      if (expiresAt < new Date()) {
        return {
          status: "error",
          message: "Token expired",
        };
      }

      const query = `DELETE FROM magic_link_tokens WHERE token = $1`;
      await this.pool.query(query, [token]);

      const sub = result.rows[0].sub;

      return {
        status: "ok",
        identity: {
          sub,
        },
      };
    }

    return {
      status: "error",
      message: "Invalid token",
    };
  }
}
