"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Class definition for control
 */
class Control {
    constructor(title, description, inPlace, modelId, componentId, createdBy, suggestionId) {
        this.title = title;
        this.description = description;
        this.inPlace = inPlace;
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
            inPlace: this.inPlace,
            modelId: this.modelId,
            componentId: this.componentId,
            suggestionId: (_a = this.suggestionId) === null || _a === void 0 ? void 0 : _a.val,
            createdBy: this.createdBy,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }
}
exports.default = Control;
//# sourceMappingURL=Control.js.map