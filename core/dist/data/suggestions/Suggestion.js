"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isControl = exports.SuggestedControl = exports.SuggestedThreat = exports.SuggestionStatus = void 0;
var SuggestionStatus;
(function (SuggestionStatus) {
    SuggestionStatus["New"] = "new";
    SuggestionStatus["Rejected"] = "rejected";
    SuggestionStatus["Accepted"] = "accepted";
})(SuggestionStatus = exports.SuggestionStatus || (exports.SuggestionStatus = {}));
class SuggestedThreat {
    constructor(id, modelId, componentId, source) {
        this.id = id;
        this.modelId = modelId;
        this.componentId = componentId;
        this.source = source;
        this.status = SuggestionStatus.New;
        this.reason = "";
        this.title = "";
        this.description = "";
    }
    toJSON() {
        return {
            id: this.id.val,
            modelId: this.modelId,
            componentId: this.componentId,
            reason: this.reason,
            title: this.title,
            description: this.description,
            status: this.status,
            source: this.source,
        };
    }
}
exports.SuggestedThreat = SuggestedThreat;
class SuggestedControl {
    constructor(id, modelId, componentId, source) {
        this.id = id;
        this.modelId = modelId;
        this.componentId = componentId;
        this.source = source;
        this.status = SuggestionStatus.New;
        this.mitigates = [];
        this.reason = "";
        this.title = "";
        this.description = "";
    }
    toJSON() {
        return {
            id: this.id.val,
            modelId: this.modelId,
            componentId: this.componentId,
            mitigates: this.mitigates,
            reason: this.reason,
            title: this.title,
            description: this.description,
            status: this.status,
            source: this.source,
        };
    }
}
exports.SuggestedControl = SuggestedControl;
function isControl(suggestion) {
    return suggestion.mitigates !== undefined;
}
exports.isControl = isControl;
//# sourceMappingURL=Suggestion.js.map