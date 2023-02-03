"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../logger");
const log = (0, logger_1.getLogger)("cache");
const THREE_HOURS_IN_MS = 1000 * 60 * 60 * 3;
class Cache {
    constructor(id, expiryMS = THREE_HOURS_IN_MS) {
        this.id = id;
        this.expiryMS = expiryMS;
        this.cache = new Map();
    }
    expire() {
        this.cache.forEach((item, key) => {
            if (item.Expiry < Date.now()) {
                this.cache.delete(key);
            }
        });
        log.debug(`${this.id} cache cleaned up. Expired items were deleted.`);
    }
    get(key) {
        const item = this.cache.get(key);
        if (item && item.Expiry > Date.now()) {
            return item.Value;
        }
        return null;
    }
    has(key) {
        return this.cache.has(key);
    }
    set(key, value) {
        const expiry = Date.now() + this.expiryMS;
        this.cache.set(key, { Expiry: expiry, Value: value });
    }
}
exports.default = Cache;
//# sourceMappingURL=cache.js.map