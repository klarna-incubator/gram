"use strict";
/**
 * GET /api/v1/systems
 * @exports {function} handler
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const systems_1 = require("@gram/core/dist/data/systems/systems");
exports.default = (dal) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const _a = req.query, { filter, page, pagesize } = _a, opts = __rest(_a, ["filter", "page", "pagesize"]);
    if (!filter ||
        !Object.values(systems_1.SystemListFilter).includes(filter.toString())) {
        return res.status(400).json("Invalid filter type.");
    }
    const validatedOpts = {};
    if (opts.teamId) {
        validatedOpts.teamId = opts.teamId.toString();
    }
    if (opts.ids) {
        validatedOpts.ids = opts.ids.toString().split(","); // Sanitized by list function
    }
    if (opts.search) {
        validatedOpts.search = opts.search.toString(); // Sanitized by list function
    }
    let pagination = { page: 0, pageSize: 10 };
    if (page || pagesize) {
        pagination = {
            page: page ? parseInt(page.toString()) : 0,
            pageSize: pagesize ? Math.min(parseInt(pagesize.toString()), 100) : 10,
        };
    }
    const result = yield systems_1.systemProvider.listSystems({ currentRequest: req }, {
        filter: filter === null || filter === void 0 ? void 0 : filter.toString(),
        opts: validatedOpts,
    }, pagination);
    // Find reviews and map latest approved one to the system.
    const complianceMap = yield getComplianceStuff(result, dal);
    return res.json(Object.assign({ systems: result.systems.map((system) => {
            var _a;
            return (Object.assign(Object.assign({}, system.toJSON()), { compliance: (_a = complianceMap.get(system.id)) === null || _a === void 0 ? void 0 : _a.toJSON() }));
        }), total: result.total }, pagination));
});
function getComplianceStuff(result, dal) {
    return __awaiter(this, void 0, void 0, function* () {
        const systemIds = result.systems.map((s) => s.id);
        const compliances = yield dal.reviewService.getComplianceForSystems(systemIds);
        const resultMap = new Map();
        compliances.forEach((c) => resultMap.set(c.SystemID, c));
        return resultMap;
    });
}
//# sourceMappingURL=list.js.map