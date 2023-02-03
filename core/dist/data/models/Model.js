"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Class definition for model
 */
class Model {
    constructor(systemId, version, createdBy) {
        this.systemId = systemId;
        this.version = version;
        this.createdBy = createdBy;
        this.data = { components: [], dataFlows: [] };
    }
    toJSON() {
        return {
            id: this.id,
            systemId: this.systemId,
            version: this.version,
            data: this.data,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            reviewApprovedAt: this.reviewApprovedAt,
            reviewStatus: this.reviewStatus,
            isTemplate: this.isTemplate,
        };
    }
}
exports.default = Model;
//# sourceMappingURL=Model.js.map