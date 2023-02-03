"use strict";
/**
 * GET /api/v1/reports/system-compliance
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSystemCompliance = void 0;
function listSystemCompliance(dal) {
    return (req, res) => __awaiter(this, void 0, void 0, function* () {
        const page = req.query["page"]
            ? parseInt(req.query["page"])
            : undefined;
        const pagesize = req.query["pagesize"]
            ? parseInt(req.query["pagesize"])
            : undefined;
        const report = yield dal.reportService.listSystemCompliance({ currentRequest: req }, pagesize, page);
        return res.json(report);
    });
}
exports.listSystemCompliance = listSystemCompliance;
//# sourceMappingURL=system-compliance.js.map