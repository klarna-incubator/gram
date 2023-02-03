import { SuggestionID } from "../../suggestions/models";
/**
 * Class definition for threat
 */
export default class Threat {
    title: string;
    description: string;
    modelId: string;
    componentId: string;
    createdBy: string;
    suggestionId?: SuggestionID | undefined;
    id?: string;
    createdAt: number;
    updatedAt: number;
    deletedAt?: number;
    isActionItem?: boolean;
    constructor(title: string, description: string, modelId: string, componentId: string, createdBy: string, suggestionId?: SuggestionID | undefined);
    toJSON(): {
        id: string | undefined;
        title: string;
        description: string;
        modelId: string;
        componentId: string;
        suggestionId: string | undefined;
        createdBy: string;
        createdAt: number;
        updatedAt: number;
        deletedAt: number | undefined;
        isActionItem: boolean | undefined;
    };
}
//# sourceMappingURL=Threat.d.ts.map