import log4js from "log4js";

const log = log4js.getLogger("cache");

const THREE_HOURS_IN_MS = 1000 * 60 * 60 * 3;

interface CacheItem<T> {
  Expiry: number;
  Value: T;
}

export default class Cache<K, T> {
  constructor(
    private id: string,
    private expiryMS: number = THREE_HOURS_IN_MS
  ) {}

  private cache = new Map<K, CacheItem<T>>();

  expire() {
    this.cache.forEach((item, key) => {
      if (item.Expiry < Date.now()) {
        this.cache.delete(key);
      }
    });
    log.debug(`${this.id} cache cleaned up. Expired items were deleted.`);
  }

  get(key: K): T | null {
    const item = this.cache.get(key);
    if (item && item.Expiry > Date.now()) {
      return item.Value;
    }
    return null;
  }

  has(key: K): boolean {
    return !!this.get(key);
  }

  set(key: K, value: T) {
    const expiry = Date.now() + this.expiryMS;
    this.cache.set(key, { Expiry: expiry, Value: value });
  }
}
