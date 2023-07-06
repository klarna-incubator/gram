import {
  AuthProvider,
  AuthProviderFormType,
  AuthProviderParams,
  LoginResult,
} from "@gram/core/dist/auth/AuthProvider";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { lookupUser } from "@gram/core/dist/auth/user";
import { linkTo } from "@gram/core/dist/util/links";
import { RequestContext } from "@gram/core/dist/data/providers/RequestContext";
import { Pool } from "pg";
import { getLogger } from "@gram/core/dist/logger";
import { randomUUID } from "crypto";

const log = getLogger("magiclink");

export class MagicLinkAuthProvider implements AuthProvider {
  key: string = "magic-link";

  dal: DataAccessLayer;
  pool: Pool;

  constructor(dal: DataAccessLayer, dbPool: Pool) {
    this.dal = dal;
    this.pool = dbPool;
  }

  async params(ctx: RequestContext): Promise<AuthProviderParams> {
    return {
      key: this.key,
      form: {
        type: AuthProviderFormType.email,
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

    if (email) {
      await this.createToken(email);
      return {
        status: "info",
        message: "Check your email for a magic link",
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
      const user = await lookupUser(ctx, sub);

      return {
        status: "ok",
        token: {
          sub,
          roles: [],
          teams: [],
          ...user,
        },
      };
    }

    return {
      status: "error",
      message: "Invalid token",
    };
  }
}
