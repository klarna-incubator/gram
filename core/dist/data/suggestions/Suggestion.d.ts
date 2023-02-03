import { SuggestionID } from "../../suggestions/models";
export declare enum SuggestionStatus {
    New = "new",
    Rejected = "rejected",
    Accepted = "accepted"
}
export declare class SuggestedThreat {
    id: SuggestionID;
    modelId: string;
    componentId: string;
    source: string;
    status: SuggestionStatus;
    constructor(id: SuggestionID, modelId: string, componentId: string, source: string);
    reason?: string | undefined;
    title: string;
    description: string;
    toJSON(): {
        id: string;
        modelId: string;
        componentId: string;
        reason: string | undefined;
        title: string;
        description: string;
        status: SuggestionStatus;
        source: string;
    };
}
export declare class SuggestedControl {
    id: SuggestionID;
    modelId: string;
    componentId: string;
    source: string;
    status: SuggestionStatus;
    constructor(id: SuggestionID, modelId: string, componentId: string, source: string);
    mitigates: {
        partialThreatId: string;
    }[];
    reason?: string | undefined;
    title: string;
    description: string;
    toJSON(): {
        id: string;
        modelId: string;
        componentId: string;
        mitigates: {
            partialThreatId: string;
        }[];
        reason: string | undefined;
        title: string;
        description: string;
        status: SuggestionStatus;
        source: string;
    };
}
export declare function isControl(suggestion: SuggestedThreat | SuggestedControl): suggestion is SuggestedControl;
//# sourceMappingURL=Suggestion.d.ts.map