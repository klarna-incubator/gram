"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionID = void 0;
const errors_1 = require("../util/errors");
class SuggestionID {
    constructor(val) {
        this.val = val;
        const parts = val.split("/");
        if (parts.length != 4 || !["threat", "control"].includes(parts[2])) {
            throw new errors_1.InvalidInputError(`Invalid format of SuggestionID (${val})`);
        }
        this.isThreat = parts[2] == "threat";
        this.partialId = `${parts[1]}/${parts[2]}/${parts[3]}`;
    }
}
exports.SuggestionID = SuggestionID;
//# sourceMappingURL=models.js.map