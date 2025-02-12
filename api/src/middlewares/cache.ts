/**
 * Cache middleware, caches requests globally (i.e. dont cache user data with this!)
 * @exports cache
 */

import { NextFunction, Request, Response } from "express";

/**
 * @returns {*} middleware
 */
function cache() {
  const cache = new Map<string, any>();

  return async (req: Request, res: Response, next: NextFunction) => {
    const cacheReq = req.get("x-data-cached");
    const cacheData = cache.get(req.originalUrl);
    if (cacheReq && cacheData && cacheData.expires > Date.now()) {
      res.set("x-data-cached", "1");
      res.json(cacheData.data);
      return;
    } else if (cacheData) {
      cache.delete(req.originalUrl);
    }

    const oldRes = res.json.bind(res);
    res.json = (body) => {
      cache.set(req.originalUrl, {
        data: body,
        expires: Date.now() + 86400 * 1000,
      });
      oldRes(body);
      return res;
    };
    next();
  };
}

export default cache;
