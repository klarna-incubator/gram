"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuggestionEngine = void 0;
const logger_1 = require("../logger");
const models_1 = require("./models");
// Controls the delay before suggestions are fetched for a model.
const SUGGESTION_DELAY = process.env.NODE_ENV && process.env.NODE_ENV === "test" ? 0 : 3000;
class SuggestionEngine {
    constructor(dal) {
        this.dal = dal;
        this.sources = [];
        this.log = (0, logger_1.getLogger)("SuggestionEngine");
        // One timeout per ModelID: should be threadsafe because node runs singlethreaded ;))
        this.delayer = new Map();
        dal.modelService.on("updated-for", ({ modelId }) => {
            this.log.debug(`model ${modelId} was updated via api`);
            // Trigger a fetch of suggestions after a delay. New activity resets the timer to avoid trigger multiple times.
            const timeout = this.delayer.get(modelId);
            if (timeout)
                clearTimeout(timeout);
            this.delayer.set(modelId, setTimeout(() => this.work(modelId), SUGGESTION_DELAY));
        });
    }
    register(source) {
        this.sources.push(source);
    }
    work(modelId) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: Debounce to prevent same modelID being called super many times.
            const partialResults = yield this.suggest(modelId);
            yield Promise.all(partialResults.map((sourceResultPR) => __awaiter(this, void 0, void 0, function* () {
                const sourceResult = yield sourceResultPR;
                this.dal.suggestionService.bulkInsert(modelId, sourceResult);
            })));
        });
    }
    /**
     * Fetches suggestions for a given modelId by aggregating to registered SuggestionSources.
     *
     * @param modelId
     * @returns An array of promises containing each SuggestedResult per SuggestionSource. These will
     * resolve asyncronously.
     */
    suggest(modelId) {
        return __awaiter(this, void 0, void 0, function* () {
            const model = yield this.dal.modelService.getById(modelId);
            if (!model) {
                this.log.warn(`Suggestions were requested for ${modelId}, which does not exist`);
                return [];
            }
            return this.sources.map((source) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const result = yield source.suggest(model);
                    return {
                        sourceSlug: source.slug,
                        controls: result.controls.map((s) => (Object.assign(Object.assign({}, s), { id: generateSuggestionId(source.slug, s) }))),
                        threats: result.threats.map((s) => (Object.assign(Object.assign({}, s), { id: generateSuggestionId(source.slug, s) }))),
                    };
                }
                catch (error) {
                    this.log.error(`SuggestionSource ${source.slug} failed while fetching suggestions`, error);
                    return {
                        sourceSlug: source.slug,
                        controls: [],
                        threats: [],
                    };
                }
            }));
        });
    }
}
exports.SuggestionEngine = SuggestionEngine;
function generateSuggestionId(sourceName, suggestion) {
    return new models_1.SuggestionID(`${suggestion.componentId}/${sourceName}/${"mitigates" in suggestion ? "control" : "threat"}/${suggestion.slug}`);
}
//# sourceMappingURL=engine.js.map