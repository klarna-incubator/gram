"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Class definition for mitigation
 */
class Mitigation {
    constructor(threatId, controlId, createdBy) {
        this.threatId = threatId;
        this.controlId = controlId;
        this.createdBy = createdBy;
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
    }
    toJSON() {
        return {
            threatId: this.threatId,
            controlId: this.controlId,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
exports.default = Mitigation;
//# sourceMappingURL=Mitigation.js.map