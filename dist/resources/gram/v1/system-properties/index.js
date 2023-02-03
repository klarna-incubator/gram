"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_1 = require("./get");
const properties_1 = require("./properties");
exports.default = (dal) => ({
    get: (0, get_1.getProperties)(dal.sysPropHandler, dal.modelService),
    properties: (0, properties_1.listProperties)(dal.sysPropHandler),
});
//# sourceMappingURL=index.js.map