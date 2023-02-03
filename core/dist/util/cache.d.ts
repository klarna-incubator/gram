export default class Cache<K, T> {
    private id;
    private expiryMS;
    constructor(id: string, expiryMS?: number);
    private cache;
    expire(): void;
    get(key: K): T | null;
    has(key: K): boolean;
    set(key: K, value: T): void;
}
//# sourceMappingURL=cache.d.ts.map