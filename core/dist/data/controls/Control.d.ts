import { SuggestionID } from "../../suggestions/models";
/**
 * Class definition for control
 */
export default class Control {
    title: string;
    description: string;
    inPlace: boolean;
    modelId: string;
    componentId: string;
    createdBy: string;
    suggestionId?: SuggestionID | undefined;
    id?: string;
    createdAt: number;
    updatedAt: number;
    constructor(title: string, description: string, inPlace: boolean, modelId: string, componentId: string, createdBy: string, suggestionId?: SuggestionID | undefined);
    toJSON(): {
        id: string | undefined;
        title: string;
        description: string;
        inPlace: boolean;
        modelId: string;
        componentId: string;
        suggestionId: string | undefined;
        createdBy: string;
        createdAt: number;
        updatedAt: number;
    };
}
//# sourceMappingURL=Control.d.ts.map