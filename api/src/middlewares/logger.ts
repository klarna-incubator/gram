/**
 * Logger middleware
 * @exports logger
 */

import { NextFunction, Response } from "express";
import _ from "lodash";
import { Logger } from "log4js";
import { LogLine } from "@gram/core/dist/logger/index.js";

function applyFilters(
  obj: any,
  blocklist: undefined | string[],
  allowlist: undefined | string[]
) {
  if (!obj) return {};

  return Object.keys(obj)
    .filter(
      (key) => !blocklist || blocklist.length === 0 || !blocklist.includes(key)
    )
    .filter(
      (key) => !allowlist || allowlist.length === 0 || allowlist.includes(key)
    )
    .reduce((final: any, key) => {
      final[key] = obj[key];
      return final;
    }, {});
}

function simplifiedLogline(
  log: Logger,
  {
    method,
    originalUrl,
    body,
    latencyMs,
  }: { method: string; latencyMs: number; originalUrl: string; body: any }
) {
  log.info(`${method} ${originalUrl} ${latencyMs}ms`);

  if (["POST", "PATCH", "PUT"].includes(method)) {
    log.debug(`body ${JSON.stringify(body)}`);
  }
}

/**
 * @param {object} opts
 * @returns {*} middleware
 */
function logger(opts: any) {
  const log = opts.logger;

  return async (req: any, res: Response, next: NextFunction) => {
    const method = req.method;
    const user = req.user
      ? _.pick(req.user, [
          "sub",
          "roles",
          "teams",
          "iss",
          "exp",
          "iat",
          "provider",
        ])
      : "anonymous";
    const originalUrl = req.originalUrl;
    const path = req.path;
    const srcIp = req.ip;

    const headers = applyFilters(
      req.headers,
      opts.excludeKeys.header,
      opts.includeKeys.header
    );
    const body = applyFilters(
      req.body,
      opts.excludeKeys.body,
      opts.includeKeys.body
    );
    const params = applyFilters(
      req.params,
      opts.excludeKeys.param,
      opts.includeKeys.param
    );
    const query = applyFilters(
      req.query,
      opts.excludeKeys.query,
      opts.includeKeys.query
    );
    const tStart = Date.now();

    res.on("finish", () => {
      const status = res.statusCode;
      const latencyMs = Date.now() - tStart;
      const logEvent: Partial<LogLine> = {
        meta: {
          method,
          user,
          originalUrl,
          path,
          srcIp,
          status,
        },
        payload: {
          headers,
          body,
          params,
          query,
          latencyMs,
        },
        // TODO: make included headers configurable (maybe reuse sentry ones?)
        // correlation_id: correlationId,
      };

      if (opts.simplified) {
        simplifiedLogline(log, { method, latencyMs, body, originalUrl });
      } else {
        log.info(logEvent);
      }
    });

    next();
  };
}

export default logger;
