/// <reference types="node" />
import { DataAccessLayer } from "../data/dal";
import { EngineSuggestedResult, SuggestionSource } from "./models";
export declare class SuggestionEngine {
    private dal;
    sources: SuggestionSource[];
    log: import("log4js").Logger;
    delayer: Map<string, NodeJS.Timeout>;
    constructor(dal: DataAccessLayer);
    register(source: SuggestionSource): void;
    work(modelId: string): Promise<void>;
    /**
     * Fetches suggestions for a given modelId by aggregating to registered SuggestionSources.
     *
     * @param modelId
     * @returns An array of promises containing each SuggestedResult per SuggestionSource. These will
     * resolve asyncronously.
     */
    suggest(modelId: string): Promise<Promise<EngineSuggestedResult>[]>;
}
//# sourceMappingURL=engine.d.ts.map