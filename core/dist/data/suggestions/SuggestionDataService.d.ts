/// <reference types="node" />
import { EventEmitter } from "events";
import { Pool } from "pg";
import { EngineSuggestedResult, SuggestionID } from "../../suggestions/models";
import Control from "../controls/Control";
import { DataAccessLayer } from "../dal";
import Threat from "../threats/Threat";
import { SuggestedControl, SuggestedThreat, SuggestionStatus } from "./Suggestion";
export declare class SuggestionDataService extends EventEmitter {
    private pool;
    private dal;
    constructor(pool: Pool, dal: DataAccessLayer);
    log: any;
    /**
     * Insert a list of Threat and Control Suggestions, intended to be used by the SuggestionEngine.
     * @param modelId
     * @param suggestions
     */
    bulkInsert(modelId: string, suggestions: EngineSuggestedResult): Promise<void>;
    listControlSuggestions(modelId: string): Promise<SuggestedControl[]>;
    listThreatSuggestions(modelId: string): Promise<SuggestedThreat[]>;
    /**
     * Delete suggestions by model id and component id
     * @param modelId
     * @param componentIds
     * @returns
     */
    deleteByComponentId(modelId: string, componentIds: string[]): Promise<boolean>;
    /**
     * Sets SuggestionStatus for a given suggestion
     * @param suggestionId either threat or control suggestionId
     * @param status the new status of the suggestion
     */
    setSuggestionStatus(modelId: string, suggestionId: SuggestionID, status: SuggestionStatus): Promise<boolean>;
    getById(modelId: string, suggestionId: SuggestionID): Promise<SuggestedThreat | SuggestedControl | null>;
    acceptSuggestion(modelId: string, suggestionId: SuggestionID, user: string): Promise<boolean>;
    getThreatsByPartialSuggestion(modelId: string, partialSuggestionIds: string[]): Promise<any[]>;
    _getLinkedThreatOrControl(modelId: string, suggestionId: SuggestionID): Promise<Control | Threat>;
}
//# sourceMappingURL=SuggestionDataService.d.ts.map