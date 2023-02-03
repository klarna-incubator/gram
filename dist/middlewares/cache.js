"use strict";
/**
 * Cache middleware, caches requests globally (i.e. dont cache user data with this!)
 * @exports cache
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @returns {*} middleware
 */
function cache() {
    const cache = new Map();
    return (req, res, next) => __awaiter(this, void 0, void 0, function* () {
        const cacheReq = req.get("x-data-cached");
        const cacheData = cache.get(req.originalUrl);
        if (cacheReq && cacheData && cacheData.expires > Date.now()) {
            res.set("x-data-cached", "1");
            return res.json(cacheData.data);
        }
        else if (cacheData) {
            cache.delete(req.originalUrl);
        }
        const oldRes = res.json.bind(res);
        res.json = (body) => {
            cache.set(req.originalUrl, {
                data: body,
                expires: Date.now() + 86400 * 1000,
            });
            return oldRes(body);
        };
        next();
    });
}
exports.default = cache;
//# sourceMappingURL=cache.js.map