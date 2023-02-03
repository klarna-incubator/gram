"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mitigationsV1 = void 0;
const create_1 = require("./create");
const delete_1 = require("./delete");
const list_1 = require("./list");
function mitigationsV1(dal) {
    return {
        list: (0, list_1.list)(dal),
        create: (0, create_1.create)(dal),
        delete: (0, delete_1._delete)(dal),
    };
}
exports.mitigationsV1 = mitigationsV1;
//# sourceMappingURL=index.js.map