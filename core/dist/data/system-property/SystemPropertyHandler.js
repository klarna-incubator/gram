"use strict";
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
exports.SystemPropertyHandler = void 0;
const logger_1 = require("../../logger");
class SystemPropertyHandler {
    constructor() {
        this.providers = [];
        this.properties = new Map();
        this.providedBy = new Map();
        this.log = (0, logger_1.getLogger)("SystemPropertyHandler");
    }
    /**
     * Register a SystemPropertyProvider to be used for fetching Context on a threat model
     * @param provider
     */
    registerSystemPropertyProvider(provider) {
        this.log.info(`registered SystemPropertyProvider ${provider.id}`);
        this.providers.push(provider);
        provider.definitions.map((d) => {
            this.properties.set(d.id, d);
            this.providedBy.set(d.id, provider);
        });
    }
    getProperties() {
        return Array.from(this.properties.values());
    }
    /**
     * Fetch all System Properties to do with a given model
     * @param model
     * @returns
     */
    contextualize(ctx, systemId, quick = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const items = [];
            const batches = yield Promise.all(this.providers.map((p) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const pItems = yield p.provideSystemProperties(ctx, systemId, quick);
                    return pItems.map((i) => (Object.assign(Object.assign({}, i), { source: p.id })));
                }
                catch (error) {
                    this.log.error(`SystemPropertyProvider ${p.id} errored while providing context`, error);
                    return [];
                }
            })));
            batches.forEach((pItems) => items.push(...pItems));
            return items;
        });
    }
    /**
     * List systems based on Properties and their values. To avoid expensive lookups, this will only
     * work with system properties that are marked "batchFilterable"
     */
    listSystemsByFilters(ctx, filters) {
        return __awaiter(this, void 0, void 0, function* () {
            // Don't filter by properties that are not marked as batchFilterable.
            filters = filters.filter((f) => { var _a; return (_a = this.properties.get(f.propertyId)) === null || _a === void 0 ? void 0 : _a.batchFilterable; });
            const results = yield Promise.all(filters.map(({ propertyId, value }) => __awaiter(this, void 0, void 0, function* () {
                const provider = this.providedBy.get(propertyId);
                if (!provider) {
                    return null;
                }
                try {
                    return yield provider.listSystemByPropertyValue(ctx, propertyId, value);
                }
                catch (err) {
                    this.log.error(`provider ${provider.id} errored while attempting to filter for systems`, err);
                    return null;
                }
            })));
            const systems = results
                .filter((result) => result)
                .reduce((prev, curr, idx) => new Set(curr === null || curr === void 0 ? void 0 : curr.filter((c) => idx < 1 || prev.has(c))), new Set());
            return Array.from(systems);
        });
    }
}
exports.SystemPropertyHandler = SystemPropertyHandler;
//# sourceMappingURL=SystemPropertyHandler.js.map