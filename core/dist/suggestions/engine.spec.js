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
const crypto_1 = require("crypto");
const dal_1 = require("../data/dal");
const postgres_1 = require("../data/postgres");
const model_1 = require("../test-util/model");
const suggestions_1 = require("../test-util/suggestions");
const engine_1 = require("./engine");
const models_1 = require("./models");
const EmptySuggestionSource = {
    name: "empty",
    slug: "empty",
    suggest: () => __awaiter(void 0, void 0, void 0, function* () { return ({ controls: [], threats: [] }); }),
};
const suggestedControl = (0, suggestions_1.genSuggestedControl)();
const suggestedThreat = (0, suggestions_1.genSuggestedThreat)();
const SampleSuggestionSource = (name, threats = [], controls = [suggestedControl]) => ({
    name,
    slug: name,
    suggest: () => __awaiter(void 0, void 0, void 0, function* () {
        return ({
            controls,
            threats,
        });
    }),
});
const ErroringSuggestionSource = {
    name: "errors",
    slug: "errors",
    suggest: () => __awaiter(void 0, void 0, void 0, function* () {
        throw new Error("boom!");
    }),
};
describe("SuggestionEngine", () => {
    let pool;
    let dal;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        pool = yield (0, postgres_1.createPostgresPool)();
        dal = new dal_1.DataAccessLayer(pool);
        dal.suggestionEngine.sources = []; // Disable the builtin engine
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        dal.suggestionEngine.sources = []; // Disable the builtin engine
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        dal.suggestionEngine.sources = []; // Disable the builtin engine
    }));
    it("should handle suggestionsource errors gracefully", () => __awaiter(void 0, void 0, void 0, function* () {
        const engine = new engine_1.SuggestionEngine(dal);
        engine.register(ErroringSuggestionSource);
        const modelId = yield (0, model_1.createSampleModel)(dal);
        yield engine.work(modelId);
    }));
    //   it("benchmark, should handle medium loads ok", () => {});
    //   it("should delete suggestions if components are deleted", () => {});
    it("should return empty by default", () => __awaiter(void 0, void 0, void 0, function* () {
        const engine = new engine_1.SuggestionEngine(dal);
        const modelId = yield (0, model_1.createSampleModel)(dal);
        const result = yield engine.suggest(modelId);
        expect(result.length).toBe(0);
    }));
    it("should return empty by default if model doesnt exist", () => __awaiter(void 0, void 0, void 0, function* () {
        const engine = new engine_1.SuggestionEngine(dal);
        const result = yield engine.suggest((0, crypto_1.randomUUID)());
        expect(result.length).toBe(0);
    }));
    it("should return empty SuggestionResult by default if source does not have any suggestions", () => __awaiter(void 0, void 0, void 0, function* () {
        const engine = new engine_1.SuggestionEngine(dal);
        engine.register(EmptySuggestionSource);
        const modelId = yield (0, model_1.createSampleModel)(dal);
        const result = yield engine.suggest(modelId);
        expect(result.length).toBe(1);
        const awaited = yield Promise.all(result);
        expect(awaited[0].controls.length).toBe(0);
        expect(awaited[0].threats.length).toBe(0);
    }));
    it("should be able to use a single source", () => __awaiter(void 0, void 0, void 0, function* () {
        const engine = new engine_1.SuggestionEngine(dal);
        engine.register(SampleSuggestionSource("sample"));
        const modelId = yield (0, model_1.createSampleModel)(dal);
        const result = yield (yield engine.suggest(modelId))[0];
        expect(result.controls.map((r) => (Object.assign(Object.assign({}, r), { id: undefined })))).toEqual([
            Object.assign(Object.assign({}, suggestedControl), { id: undefined }),
        ]);
    }));
    it("should insert suggested threats", () => __awaiter(void 0, void 0, void 0, function* () {
        const engine = new engine_1.SuggestionEngine(dal);
        engine.register(SampleSuggestionSource("sample", [suggestedThreat], []));
        const modelId = yield (0, model_1.createSampleModel)(dal);
        const result = yield (yield engine.suggest(modelId))[0];
        expect(result.controls).toHaveLength(0);
        expect(result.threats.map((r) => (Object.assign(Object.assign({}, r), { id: undefined })))).toEqual([
            Object.assign(Object.assign({}, suggestedThreat), { id: undefined }),
        ]);
    }));
    it("should insert suggested controls", () => __awaiter(void 0, void 0, void 0, function* () {
        const engine = new engine_1.SuggestionEngine(dal);
        engine.register(SampleSuggestionSource("sample"));
        const modelId = yield (0, model_1.createSampleModel)(dal);
        const result = yield (yield engine.suggest(modelId))[0];
        expect(result.controls.map((r) => (Object.assign(Object.assign({}, r), { id: undefined })))).toEqual([
            Object.assign(Object.assign({}, suggestedControl), { id: undefined }),
        ]);
        expect(result.threats).toHaveLength(0);
    }));
    it("should combine results for multiple sources", () => __awaiter(void 0, void 0, void 0, function* () {
        const engine = new engine_1.SuggestionEngine(dal);
        engine.register(SampleSuggestionSource("sample1"));
        engine.register(SampleSuggestionSource("sample2"));
        const modelId = yield (0, model_1.createSampleModel)(dal);
        const result = yield engine.suggest(modelId);
        expect(result.length).toEqual(2);
        const awaited = yield Promise.all(result);
        expect(awaited[0].controls.length).toBe(1);
        expect(awaited[1].controls.length).toBe(1);
        expect([awaited[0].controls[0], awaited[1].controls[0]]).toEqual([
            Object.assign(Object.assign({}, suggestedControl), { id: new models_1.SuggestionID(`${suggestedControl.componentId}/sample1/control/${suggestedControl.slug}`) }),
            Object.assign(Object.assign({}, suggestedControl), { id: new models_1.SuggestionID(`${suggestedControl.componentId}/sample2/control/${suggestedControl.slug}`) }),
        ]);
    }));
});
//# sourceMappingURL=engine.spec.js.map