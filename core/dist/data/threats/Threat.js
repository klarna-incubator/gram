"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Class definition for threat
 */
class Threat {
    constructor(title, description, modelId, componentId, createdBy, suggestionId) {
        this.title = title;
        this.description = description;
        this.modelId = modelId;
        this.componentId = componentId;
        this.createdBy = createdBy;
        this.suggestionId = suggestionId;
        this.createdAt = Date.now();
        this.updatedAt = Date.now();
    }
    toJSON() {
        var _a;
        return {
            id: this.id,
            title: this.title,
            description: this.description,
            modelId: this.modelId,
            componentId: this.componentId,
            suggestionId: (_a = this.suggestionId) === null || _a === void 0 ? void 0 : _a.val,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            deletedAt: this.deletedAt,
            isActionItem: this.isActionItem,
        };
    }
}
exports.default = Threat;
//# sourceMappingURL=Threat.js.map