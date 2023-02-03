import Model from "../data/models/Model";
import { InvalidInputError } from "../util/errors";

export interface Suggestion {
  // Should be semi-static, to avoid duplicate suggestions on the same component.
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

export class SuggestionID {
  constructor(public val: string) {
    const parts = val.split("/");
    if (parts.length != 4 || !["threat", "control"].includes(parts[2])) {
      throw new InvalidInputError(`Invalid format of SuggestionID (${val})`);
    }

    this.isThreat = parts[2] == "threat";
    this.partialId = `${parts[1]}/${parts[2]}/${parts[3]}`;
  }

  public isThreat: boolean;
  public partialId: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface SourceSuggestedThreat extends Suggestion {
  // /**
  //  * Determines the severity of this threat. Will iterate on this later.
  //  */
  // severity: string;
}

export interface SourceSuggestedControl extends Suggestion {
  mitigates: {
    partialThreatId: string;
    // effectiveness: string
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
