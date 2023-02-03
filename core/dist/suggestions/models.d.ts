import Model from "../data/models/Model";
export interface Suggestion {
    slug: string;
    /**
     * To understand why it was suggested by the source.
     */
    reason?: string;
    /**
     * The component for which this is suggested for
     */
    componentId: string;
    /**
     * Short title of the suggested threat
     */
    title: string;
    /**
     * Description that summarizes the control. Link to documentation if more than a few sentences is needed.
     * TODO: add reference link to model?
     */
    description: string;
}
export declare class SuggestionID {
    val: string;
    constructor(val: string);
    isThreat: boolean;
    partialId: string;
}
export interface SourceSuggestedThreat extends Suggestion {
}
export interface SourceSuggestedControl extends Suggestion {
    mitigates: {
        partialThreatId: string;
    }[];
}
export interface SuggestionResult {
    controls: SourceSuggestedControl[];
    threats: SourceSuggestedThreat[];
}
export interface SuggestionSource {
    /**
     * Human-readable ID.
     */
    slug: string;
    /**
     * Human-readable, descriptive name that can be used e.g. in front-end stuff.
     */
    name: string;
    /**
     * Function called to produce a batch of SuggestionResults for an entire model.
     *
     * @param model
     */
    suggest(model: Model): Promise<SuggestionResult>;
}
export interface EngineSuggestedControl extends SourceSuggestedControl {
    id: SuggestionID;
}
export interface EngineSuggestedThreat extends SourceSuggestedThreat {
    id: SuggestionID;
}
export interface EngineSuggestedResult {
    /**
     * The identifier for the SuggestionSource that was used for this result.
     */
    sourceSlug: string;
    controls: EngineSuggestedControl[];
    threats: EngineSuggestedThreat[];
}
//# sourceMappingURL=models.d.ts.map