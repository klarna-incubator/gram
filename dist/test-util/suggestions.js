"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genSuggestedControl = exports.genSuggestedThreat = void 0;
const crypto_1 = require("crypto");
const models_1 = require("@gram/core/dist/suggestions/models");
function genSuggestedThreat() {
    const componentId = (0, crypto_1.randomUUID)();
    return {
        id: new models_1.SuggestionID(`${componentId}/test-source/threat/t-${(0, crypto_1.randomUUID)()}`),
        componentId,
        description: `description of threat - ${(0, crypto_1.randomUUID)()}`,
        slug: `t-${(0, crypto_1.randomUUID)()}`,
        title: `threat ${(0, crypto_1.randomUUID)()}`,
        reason: `reason for ${(0, crypto_1.randomUUID)()}`,
    };
}
exports.genSuggestedThreat = genSuggestedThreat;
function genSuggestedControl(mitigates = []) {
    const componentId = (0, crypto_1.randomUUID)();
    return {
        id: new models_1.SuggestionID(`${componentId}/test-source/control/t-${(0, crypto_1.randomUUID)()}`),
        componentId,
        description: `description of control - ${(0, crypto_1.randomUUID)()}`,
        slug: `t-${(0, crypto_1.randomUUID)()}`,
        title: `control ${(0, crypto_1.randomUUID)()}`,
        reason: `reason for ${(0, crypto_1.randomUUID)()}`,
        mitigates,
    };
}
exports.genSuggestedControl = genSuggestedControl;
//# sourceMappingURL=suggestions.js.map