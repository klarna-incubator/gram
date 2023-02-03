"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const create_1 = require("./create");
const delete_1 = require("./delete");
const list_1 = require("./list");
const update_1 = require("./update");
exports.default = (dal) => ({
    list: (0, list_1.list)(dal),
    create: (0, create_1.create)(dal),
    delete: (0, delete_1._delete)(dal),
    update: (0, update_1.update)(dal),
});
//# sourceMappingURL=index.js.map