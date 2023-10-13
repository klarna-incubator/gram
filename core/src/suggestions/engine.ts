import { DataAccessLayer } from "../data/dal.js";
import log4js from "log4js";
import {
  EngineSuggestedResult,
  SourceSuggestedControl,
  SourceSuggestedThreat,
  SuggestionID,
  SuggestionSource,
} from "./models.js";

// Controls the delay before suggestions are fetched for a model.
const SUGGESTION_DELAY =
  process.env.NODE_ENV && process.env.NODE_ENV === "test" ? 0 : 3000;

export class SuggestionEngine {
  public sources: SuggestionSource[] = [];
  log = log4js.getLogger("SuggestionEngine");

  // One timeout per ModelID: should be threadsafe because node runs singlethreaded ;))
  delayer = new Map<string, NodeJS.Timeout>();

  constructor(private dal: DataAccessLayer, public noListen: boolean = false) {
    dal.modelService.on("updated-for", ({ modelId }) => {
      if (!this.noListen) {
        this.log.debug(`model ${modelId} was updated via api`);
        // Trigger a fetch of suggestions after a delay. New activity resets the timer to avoid trigger multiple times.
        const timeout = this.delayer.get(modelId);
        if (timeout) clearTimeout(timeout);
        this.delayer.set(
          modelId,
          setTimeout(() => this.work(modelId), SUGGESTION_DELAY)
        );
      }
    });
  }

  register(source: SuggestionSource) {
    this.sources.push(source);
  }

  async work(modelId: string) {
    // TODO: Debounce to prevent same modelID being called super many times.
    const partialResults = await this.suggest(modelId);
    await Promise.all(
      partialResults.map(async (sourceResultPR) => {
        const sourceResult = await sourceResultPR;
        this.dal.suggestionService.bulkInsert(modelId, sourceResult);
      })
    );
  }

  /**
   * Fetches suggestions for a given modelId by aggregating to registered SuggestionSources.
   *
   * @param modelId
   * @returns An array of promises containing each SuggestedResult per SuggestionSource. These will
   * resolve asyncronously.
   */
  async suggest(modelId: string): Promise<Promise<EngineSuggestedResult>[]> {
    const model = await this.dal.modelService.getById(modelId);
    if (!model) {
      this.log.warn(
        `Suggestions were requested for ${modelId}, which does not exist`
      );
      return [];
    }

    return this.sources.map(async (source) => {
      try {
        const result = await source.suggest(model);
        return {
          sourceSlug: source.slug,
          controls: result.controls.map((s) => ({
            ...s,
            id: generateSuggestionId(source.slug, s),
            source: source.slug,
          })),
          threats: result.threats.map((s) => ({
            ...s,
            id: generateSuggestionId(source.slug, s),
            source: source.slug,
          })),
        };
      } catch (error: any) {
        this.log.error(
          `SuggestionSource ${source.slug} failed while fetching suggestions`,
          error
        );
        return {
          sourceSlug: source.slug,
          controls: [],
          threats: [],
        };
      }
    });
  }
}

function generateSuggestionId(
  sourceName: string,
  suggestion: SourceSuggestedThreat | SourceSuggestedControl
): SuggestionID {
  return new SuggestionID(
    `${suggestion.componentId}/${sourceName}/${
      "mitigates" in suggestion ? "control" : "threat"
    }/${suggestion.slug}`
  );
}
