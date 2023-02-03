"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSystemProvider = exports.systemProvider = exports.SystemListFilter = void 0;
var SystemListFilter;
(function (SystemListFilter) {
    SystemListFilter["Batch"] = "batch";
    SystemListFilter["Search"] = "search";
    SystemListFilter["Team"] = "team";
})(SystemListFilter = exports.SystemListFilter || (exports.SystemListFilter = {}));
class DefaultSystemProvider {
    constructor() {
        this.key = "default";
    }
    getSystem(ctx, systemId) {
        throw new Error("Method not implemented.");
    }
    listSystems(ctx, input, pagination = { page: 0, pageSize: 10 }) {
        throw new Error("Method not implemented.");
    }
}
exports.systemProvider = new DefaultSystemProvider();
function setSystemProvider(newSystemProvider) {
    exports.systemProvider = newSystemProvider;
}
exports.setSystemProvider = setSystemProvider;
//# sourceMappingURL=systems.js.map