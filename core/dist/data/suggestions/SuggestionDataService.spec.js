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
const models_1 = require("../../suggestions/models");
const model_1 = require("../../test-util/model");
const suggestions_1 = require("../../test-util/suggestions");
const dal_1 = require("../dal");
const postgres_1 = require("../postgres");
const utils_1 = require("../utils");
const Suggestion_1 = require("./Suggestion");
describe("SuggestionDataService implementation", () => {
    let pool;
    let dal;
    let modelId;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        pool = yield (0, postgres_1.createPostgresPool)();
        dal = new dal_1.DataAccessLayer(pool);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, utils_1._deleteAllTheThings)(pool);
        /** Set up test model needed for review **/
        modelId = yield (0, model_1.createSampleModel)(dal);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield pool.end();
    }));
    describe("bulkInsert", () => {
        it("should be able to insert empty threats and controls", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestions = {
                sourceSlug: "test",
                controls: [],
                threats: [],
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
        }));
        it("should be able to insert multiple threats and controls", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestions = {
                sourceSlug: "test",
                controls: [...new Array(50)].map(suggestions_1.genSuggestedControl),
                threats: [...new Array(50)].map(suggestions_1.genSuggestedThreat),
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
            const controls = yield dal.suggestionService.listControlSuggestions(modelId);
            expect(controls.length).toBe(50);
            expect(controls[0].status).toBe(Suggestion_1.SuggestionStatus.New);
            expect(controls[0].source).toBe("test");
            expect(controls[0].modelId).toBe(modelId);
        }));
        it("should remove unused suggestions that are no longer included in the batch, but keep ones that have been added/rejected", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestions = {
                sourceSlug: "test",
                controls: [...new Array(50)].map(suggestions_1.genSuggestedControl),
                threats: [...new Array(50)].map(suggestions_1.genSuggestedThreat),
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
            // Set some as added/rejected
            yield Promise.all(suggestions.controls
                .slice(25, 30)
                .map((c) => dal.suggestionService.acceptSuggestion(modelId, c.id, "someuser")));
            yield Promise.all(suggestions.threats
                .slice(25, 30)
                .map((t) => dal.suggestionService.setSuggestionStatus(modelId, t.id, Suggestion_1.SuggestionStatus.Rejected)));
            const suggestionsAfter = {
                sourceSlug: "test",
                controls: suggestions.controls.slice(0, 25),
                threats: suggestions.threats.slice(0, 25),
            };
            expect(suggestionsAfter.controls).toHaveLength(25);
            yield dal.suggestionService.bulkInsert(modelId, suggestionsAfter);
            let res = yield dal.suggestionService.listThreatSuggestions(modelId);
            expect(res).toHaveLength(30);
            expect(res.filter((t) => t.status == Suggestion_1.SuggestionStatus.Rejected).length).toBe(5);
            res = yield dal.suggestionService.listControlSuggestions(modelId);
            expect(res).toHaveLength(30);
            expect(res.filter((t) => t.status == Suggestion_1.SuggestionStatus.Accepted).length).toBe(5);
        }));
        it("should not have different sources interfering with each others' batches", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestions = {
                sourceSlug: "test",
                controls: [...new Array(50)].map(suggestions_1.genSuggestedControl),
                threats: [...new Array(50)].map(suggestions_1.genSuggestedThreat),
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
            const suggestionsAfter = {
                sourceSlug: "test-2",
                controls: [(0, suggestions_1.genSuggestedControl)()],
                threats: [],
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestionsAfter);
            let res = yield dal.suggestionService.listThreatSuggestions(modelId);
            expect(res).toHaveLength(50);
            res = yield dal.suggestionService.listControlSuggestions(modelId);
            expect(res).toHaveLength(51);
        }));
        it("should not have different models interfering with each others' batches", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestions = {
                sourceSlug: "test",
                controls: [...new Array(3)].map(suggestions_1.genSuggestedControl),
                threats: [...new Array(4)].map(suggestions_1.genSuggestedThreat),
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
            const suggestionsAfter = {
                sourceSlug: "test",
                controls: [(0, suggestions_1.genSuggestedControl)()],
                threats: [],
            };
            const anotherModelId = yield (0, model_1.createSampleModel)(dal);
            yield dal.suggestionService.bulkInsert(anotherModelId, suggestionsAfter);
            let res = yield dal.suggestionService.listThreatSuggestions(modelId);
            expect(res).toHaveLength(4);
            res = yield dal.suggestionService.listControlSuggestions(modelId);
            expect(res).toHaveLength(3);
            res = yield dal.suggestionService.listControlSuggestions(anotherModelId);
            expect(res).toHaveLength(1);
        }));
        it("should insert control suggestions with empty mitigations", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestionsAfter = {
                sourceSlug: "test",
                controls: [(0, suggestions_1.genSuggestedControl)()],
                threats: [],
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestionsAfter);
            const res = yield dal.suggestionService.listThreatSuggestions(modelId);
            expect(res).toHaveLength(0);
            const controlres = yield dal.suggestionService.listControlSuggestions(modelId);
            expect(controlres).toHaveLength(1);
            expect(controlres[0].mitigates).toHaveLength(0);
        }));
        it("should insert control suggestions with list of mitigations", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestThreats = [...Array(10)].map(suggestions_1.genSuggestedThreat);
            const partialThreatIds = suggestThreats.map((t) => t.id.val.split("/").slice(1).join("/"));
            const suggestControl = (0, suggestions_1.genSuggestedControl)(partialThreatIds.map((partialThreatId) => ({ partialThreatId })));
            const suggestions = {
                sourceSlug: "test",
                controls: [suggestControl],
                threats: suggestThreats,
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
            const res = yield dal.suggestionService.listThreatSuggestions(modelId);
            expect(res).toHaveLength(10);
            const controlres = yield dal.suggestionService.listControlSuggestions(modelId);
            expect(controlres).toHaveLength(1);
            expect(controlres[0].mitigates).toHaveLength(10);
            expect(controlres[0].mitigates.map((m) => m.partialThreatId)).toEqual(partialThreatIds);
        }));
    });
    describe("listControlSuggestions", () => {
        it("should return an empty list if no suggestions", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestions = {
                sourceSlug: "test",
                controls: [],
                threats: [],
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
            const res = yield dal.suggestionService.listControlSuggestions(modelId);
            expect(res).toHaveLength(0);
        }));
        it("should return a list", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestions = {
                sourceSlug: "test",
                controls: [...new Array(50)].map(() => (0, suggestions_1.genSuggestedControl)()),
                threats: [],
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
            const res = yield dal.suggestionService.listControlSuggestions(modelId);
            expect(res).toHaveLength(50);
            res.forEach((element) => {
                expect(element.modelId).toBe(modelId);
            });
        }));
        it("should return the correct list", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestions = {
                sourceSlug: "test",
                controls: [...new Array(50)].map(() => (0, suggestions_1.genSuggestedControl)()),
                threats: [],
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
            const anotherModelId = yield (0, model_1.createSampleModel)(dal);
            yield dal.suggestionService.bulkInsert(anotherModelId, suggestions);
            const res = yield dal.suggestionService.listControlSuggestions(modelId);
            expect(res).toHaveLength(50);
            res.forEach((element) => {
                expect(element.modelId).toBe(modelId);
            });
        }));
    });
    describe("listThreatSuggestions", () => {
        it("should return an empty list if no suggestions", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestions = {
                sourceSlug: "test",
                controls: [],
                threats: [],
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
            const res = yield dal.suggestionService.listThreatSuggestions(modelId);
            expect(res).toHaveLength(0);
        }));
        it("should return a list", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestions = {
                sourceSlug: "test",
                controls: [],
                threats: [...new Array(50)].map(() => (0, suggestions_1.genSuggestedThreat)()),
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
            const res = yield dal.suggestionService.listThreatSuggestions(modelId);
            expect(res).toHaveLength(50);
            res.forEach((element) => {
                expect(element.modelId).toBe(modelId);
            });
        }));
    });
    describe("acceptSuggestion", () => {
        it("should return false if suggestion not found", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield dal.suggestionService.acceptSuggestion(modelId, new models_1.SuggestionID(`${(0, crypto_1.randomUUID)()}/test-source/threat/test-1-23`), "someuser");
            expect(res).toBe(false);
        }));
        it("should return true if suggestion is control or threat", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestThreat = (0, suggestions_1.genSuggestedThreat)();
            const suggestControl = (0, suggestions_1.genSuggestedControl)([
                { partialThreatId: suggestThreat.id.val.split("/").slice(1).join("/") },
            ]);
            const suggestions = {
                sourceSlug: "test",
                controls: [suggestControl],
                threats: [suggestThreat],
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
            let res = yield dal.suggestionService.acceptSuggestion(modelId, suggestions.controls[0].id, "someuser");
            expect(res).toBe(true);
            let suggestion = (yield dal.suggestionService.getById(modelId, suggestions.controls[0].id));
            expect(suggestion.status).toBe(Suggestion_1.SuggestionStatus.Accepted);
            const control = yield dal.suggestionService._getLinkedThreatOrControl(modelId, suggestions.controls[0].id);
            expect(control.title).toEqual(suggestion.title);
            expect(control.description).toEqual(suggestion.description);
            // At this point, no mitigation should exist.
            res = yield dal.suggestionService.acceptSuggestion(modelId, suggestions.threats[0].id, "someuser");
            expect(res).toBe(true);
            suggestion = (yield dal.suggestionService.getById(modelId, suggestions.threats[0].id));
            expect(suggestion.status).toBe(Suggestion_1.SuggestionStatus.Accepted);
        }));
        it("should create mitigation(s) if relevant threat exists", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestThreats = [...Array(5)].map(suggestions_1.genSuggestedThreat);
            const suggestControl = (0, suggestions_1.genSuggestedControl)(suggestThreats.map((suggestThreat) => ({
                partialThreatId: suggestThreat.id.val.split("/").slice(1).join("/"),
            })));
            const suggestions = {
                sourceSlug: "test",
                controls: [suggestControl],
                threats: suggestThreats,
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
            yield Promise.all(suggestThreats.map((suggestedThreat) => __awaiter(void 0, void 0, void 0, function* () {
                const res = yield dal.suggestionService.acceptSuggestion(modelId, suggestedThreat.id, "someuser");
                expect(res).toBe(true);
            })));
            const res = yield dal.suggestionService.acceptSuggestion(modelId, suggestions.controls[0].id, "someuser");
            expect(res).toBe(true);
            const control = (yield dal.suggestionService._getLinkedThreatOrControl(modelId, suggestions.controls[0].id));
            yield Promise.all(suggestThreats.map((suggestedThreat) => __awaiter(void 0, void 0, void 0, function* () {
                const threat = (yield dal.suggestionService._getLinkedThreatOrControl(modelId, suggestedThreat.id));
                expect(threat.title).toEqual(suggestedThreat.title);
                expect(threat.description).toEqual(suggestedThreat.description);
                const mitigation = yield dal.mitigationService.getById(threat.id, control.id);
                expect(mitigation).toBeTruthy();
            })));
        }));
        it("should NOT create mitigation if relevant threat does NOT exists", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestThreat = (0, suggestions_1.genSuggestedThreat)();
            const suggestControl = (0, suggestions_1.genSuggestedControl)([
                {
                    partialThreatId: suggestThreat.id.val.split("/").slice(1).join("/") + "not-the-same",
                },
            ]);
            const suggestions = {
                sourceSlug: "test",
                controls: [suggestControl],
                threats: [suggestThreat],
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
            let res = yield dal.suggestionService.acceptSuggestion(modelId, suggestions.threats[0].id, "someuser");
            expect(res).toBe(true);
            const threat = (yield dal.suggestionService._getLinkedThreatOrControl(modelId, suggestions.threats[0].id));
            expect(threat.title).toEqual(suggestThreat.title);
            expect(threat.description).toEqual(suggestThreat.description);
            res = yield dal.suggestionService.acceptSuggestion(modelId, suggestions.controls[0].id, "someuser");
            expect(res).toBe(true);
            const control = (yield dal.suggestionService._getLinkedThreatOrControl(modelId, suggestions.controls[0].id));
            const mitigation = yield dal.mitigationService.getById(threat.id, control.id);
            expect(mitigation).toBeNull();
        }));
        it("should NOT list deleted threats from partialId", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestThreat = (0, suggestions_1.genSuggestedThreat)();
            const suggestControl = (0, suggestions_1.genSuggestedControl)([
                {
                    partialThreatId: suggestThreat.id.val.split("/").slice(1).join("/"),
                },
            ]);
            const suggestions = {
                sourceSlug: "test",
                controls: [suggestControl],
                threats: [suggestThreat],
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
            const res = yield dal.suggestionService.acceptSuggestion(modelId, suggestThreat.id, "someuser");
            expect(res).toBe(true);
            const reslist = yield dal.threatService
                .list(modelId)
                .then((res) => res.find((t) => t.title === suggestThreat.title));
            yield dal.threatService.delete(modelId, reslist.id);
            const respartial = yield dal.suggestionService.getThreatsByPartialSuggestion(modelId, [
                suggestControl.mitigates[0].partialThreatId,
            ]);
            expect(respartial).toEqual([]);
        }));
    });
    describe("setSuggestionStatus", () => {
        it("should return false if suggestion not found", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield dal.suggestionService.setSuggestionStatus(modelId, new models_1.SuggestionID(`${(0, crypto_1.randomUUID)()}/test-source/threat/test-1-23`), Suggestion_1.SuggestionStatus.Rejected);
            expect(res).toBe(false);
        }));
        it("should be able to set all statuses", () => __awaiter(void 0, void 0, void 0, function* () {
            const suggestions = {
                sourceSlug: "test",
                controls: [(0, suggestions_1.genSuggestedControl)()],
                threats: [(0, suggestions_1.genSuggestedThreat)()],
            };
            yield dal.suggestionService.bulkInsert(modelId, suggestions);
            [
                Suggestion_1.SuggestionStatus.Accepted,
                Suggestion_1.SuggestionStatus.New,
                Suggestion_1.SuggestionStatus.Rejected,
            ].forEach((status) => __awaiter(void 0, void 0, void 0, function* () {
                let res = yield dal.suggestionService.setSuggestionStatus(modelId, suggestions.threats[0].id, status);
                expect(res).toBe(true);
                res = yield dal.suggestionService.setSuggestionStatus(modelId, suggestions.controls[0].id, status);
                expect(res).toBe(true);
                const controls = yield dal.suggestionService.listControlSuggestions(modelId);
                expect(controls[0].status).toBe(status);
                const threats = yield dal.suggestionService.listThreatSuggestions(modelId);
                expect(threats[0].status).toBe(status);
            }));
        }));
    });
});
//# sourceMappingURL=SuggestionDataService.spec.js.map