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
exports.searchClasses = void 0;
const component_classes_1 = require("@gram/core/dist/data/component-classes");
const searchClasses = (ccHandler) => (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const type = req.query.type;
    const search = req.query.search;
    if (typeof type !== "string" || !component_classes_1.ComponentTypes.includes(type)) {
        return res
            .status(400)
            .json({ error: `type must be one of ${component_classes_1.ComponentTypes}` });
    }
    if (typeof search !== "string") {
        return res
            .status(400)
            .json({ error: `invalid search parameter (not a string?)` });
    }
    const classes = ccHandler.search(type, search);
    return res.json({
        truncated: classes.length > 50,
        count: classes.length,
        classes: classes.slice(0, 50),
    });
});
exports.searchClasses = searchClasses;
//# sourceMappingURL=search.js.map