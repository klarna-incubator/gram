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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
const Control_1 = __importDefault(require("../controls/Control"));
const dal_1 = require("../dal");
const Mitigation_1 = __importDefault(require("../mitigations/Mitigation"));
const Model_1 = __importDefault(require("../models/Model"));
const postgres_1 = require("../postgres");
const utils_1 = require("../utils");
const Threat_1 = __importDefault(require("./Threat"));
describe("ThreatDataService implementation", () => {
    let data;
    let dal;
    let pool;
    let model;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        pool = yield (0, postgres_1.createPostgresPool)();
        dal = new dal_1.DataAccessLayer(pool);
        data = dal.threatService;
        yield (0, utils_1._deleteAllTheThings)(pool);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, utils_1._deleteAllTheThings)(pool);
        model = new Model_1.default("some-system-id", "some-version", "root");
        model.data = { components: [], dataFlows: [] };
        model.id = yield dal.modelService.create(model);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield pool.end();
    }));
    describe("getById threat", () => {
        it("should return a valid threat", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const threat = new Threat_1.default("title", "description", model.id, componentId, "createdBy");
            threat.id = yield data.create(threat);
            const fetched = yield data.getById(threat.id);
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.toJSON()).toBeDefined();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.id).toBe(threat.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.modelId).toBe(model.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.componentId).toBe(componentId);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.title).toBe("title");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdBy).toBe("createdBy");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.suggestionId).toBe(undefined);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.description).toBe("description");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeGreaterThan(yesterday.getTime());
        }));
        it("should return null value by default", () => __awaiter(void 0, void 0, void 0, function* () {
            const threat = yield data.getById((0, crypto_1.randomUUID)());
            expect(threat).toBe(null);
        }));
    });
    describe("list threats", () => {
        it("should return threats of model", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const threat1 = new Threat_1.default("title1", "description1", model.id, componentId, "createdBy1");
            threat1.id = yield data.create(threat1);
            const threat2 = new Threat_1.default("title2", "description2", model.id, componentId, "createdBy2");
            threat2.id = yield data.create(threat2);
            const threats = yield data.list(model.id);
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(threats.length).toEqual(2);
            expect(threats[0].toJSON()).toBeDefined();
            expect(threats[0].id).toBe(threat2.id);
            expect(threats[0].modelId).toBe(model.id);
            expect(threats[0].componentId).toBe(componentId);
            expect(threats[0].title).toBe("title2");
            expect(threats[0].createdBy).toBe("createdBy2");
            expect(threats[0].suggestionId).toBe(undefined);
            expect(threats[0].description).toBe("description2");
            expect(threats[0].createdAt).toBeLessThan(Date.now() + 1000);
            expect(threats[0].createdAt).toBeGreaterThan(yesterday.getTime());
            expect(threats[0].updatedAt).toBeLessThan(Date.now() + 1000);
            expect(threats[0].updatedAt).toBeGreaterThan(yesterday.getTime());
            expect(threats[1].toJSON()).toBeDefined();
            expect(threats[1].id).toBe(threat1.id);
            expect(threats[1].modelId).toBe(model.id);
            expect(threats[1].componentId).toBe(componentId);
            expect(threats[1].title).toBe("title1");
            expect(threats[1].createdBy).toBe("createdBy1");
            expect(threats[1].suggestionId).toBe(undefined);
            expect(threats[1].description).toBe("description1");
            expect(threats[1].createdAt).toBeLessThan(Date.now() + 1000);
            expect(threats[1].createdAt).toBeGreaterThan(yesterday.getTime());
            expect(threats[1].updatedAt).toBeLessThan(Date.now() + 1000);
            expect(threats[1].updatedAt).toBeGreaterThan(yesterday.getTime());
        }));
        it("should return null value by default", () => __awaiter(void 0, void 0, void 0, function* () {
            const threats = yield data.list((0, crypto_1.randomUUID)());
            expect(threats).toEqual([]);
        }));
    });
    describe("list action items", () => {
        it("should return threats of model that are marked as action items", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const threat1 = new Threat_1.default("title1", "description1", model.id, componentId, "createdBy1");
            threat1.id = yield data.create(threat1);
            const threat2 = new Threat_1.default("title2", "description2", model.id, componentId, "createdBy2");
            threat2.id = yield data.create(threat2);
            yield data.update(model.id, threat2.id, { isActionItem: true });
            const threats = yield data.listActionItems(model.id);
            expect(threats.length).toEqual(1);
            expect(threats[0].toJSON()).toBeDefined();
            expect(threats[0].id).toBe(threat2.id);
        }));
        it("should return null value by default", () => __awaiter(void 0, void 0, void 0, function* () {
            const threats = yield data.list((0, crypto_1.randomUUID)());
            expect(threats).toEqual([]);
        }));
    });
    describe("delete threat", () => {
        it("should return false on deleting non-existent threat", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield data.delete(model.id, (0, crypto_1.randomUUID)());
            expect(res).toBeFalsy();
        }));
        it("should not delete other rows", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const threat = new Threat_1.default("title", "description", model.id, componentId, "createdBy");
            threat.id = yield data.create(threat);
            const res = yield data.delete(model.id, (0, crypto_1.randomUUID)());
            expect(res).toBeFalsy();
            const fetched = yield data.getById(threat.id);
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(fetched).toBeTruthy();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.toJSON()).toBeDefined();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.id).toBe(threat.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.modelId).toBe(model.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.componentId).toBe(componentId);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.title).toBe("title");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdBy).toBe("createdBy");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.suggestionId).toBe(undefined);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.description).toBe("description");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeGreaterThan(yesterday.getTime());
        }));
        it("should not be able to fetch deleted row", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const threat = new Threat_1.default("title", "description", model.id, componentId, "createdBy");
            threat.id = yield data.create(threat);
            const res = yield data.delete(model.id, threat.id);
            expect(res).toBeTruthy();
            const fetched = yield data.getById(threat.id);
            expect(fetched).toBeFalsy();
        }));
        it("should delete associated mitigations", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const control = new Control_1.default("title", "description", true, model.id, componentId, "createdBy");
            control.id = yield dal.controlService.create(control);
            const threat2 = new Threat_1.default("title2", "description2", model.id, componentId, "createdBy2");
            threat2.id = yield data.create(threat2);
            const threat = new Threat_1.default("title2threat", "description2threat", model.id, componentId, "createdBy2threat");
            threat.id = yield data.create(threat);
            const mitigation = new Mitigation_1.default(threat.id, control.id, "createdBy2threat1");
            const res1 = yield dal.mitigationService.create(mitigation);
            expect(res1).toBeTruthy();
            const { threatId, controlId } = res1
                ? res1
                : { threatId: "", controlId: "" };
            const mitigation2 = new Mitigation_1.default(threat2.id, control.id, "createdBy2threat3");
            const res2 = yield dal.mitigationService.create(mitigation2);
            expect(res2).toBeTruthy();
            const { threatId: threat2Id } = res2 ? res2 : { threatId: "" };
            const mitigationRes = yield dal.mitigationService.getById(threatId, controlId);
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(mitigationRes.toJSON()).toBeDefined();
            expect(mitigationRes.threatId).toBe(threatId);
            expect(mitigationRes.controlId).toBe(controlId);
            expect(mitigationRes.createdBy).toBe("createdBy2threat1");
            expect(mitigationRes.createdAt).toBeLessThan(Date.now() + 1000);
            expect(mitigationRes.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(mitigationRes.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(mitigationRes.updatedAt).toBeGreaterThan(yesterday.getTime());
            const res = yield data.delete(model.id, threatId);
            expect(res).toBeTruthy();
            const fetchDeleted = yield dal.mitigationService.getById(threatId, controlId);
            expect(fetchDeleted).toBe(null);
            const fetched = yield dal.mitigationService.getById(threat2Id, controlId);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.toJSON()).toBeDefined();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.threatId).toBe(threat2Id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.controlId).toBe(controlId);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdBy).toBe("createdBy2threat3");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeGreaterThan(yesterday.getTime());
        }));
    });
    describe("update threat", () => {
        it("should update threat", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const threat = new Threat_1.default("title", "description", model.id, componentId, "createdBy");
            threat.id = yield data.create(threat);
            const fetched = yield data.getById(threat.id);
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.toJSON()).toBeDefined();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.id).toBe(threat.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.modelId).toBe(model.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.componentId).toBe(componentId);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.title).toBe("title");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdBy).toBe("createdBy");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.suggestionId).toBe(undefined);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.description).toBe("description");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeGreaterThan(yesterday.getTime());
            const updated = yield data.update(model.id, threat.id, {
                title: "newtitle",
                description: "baddesc",
            });
            expect(updated).toBeInstanceOf(Threat_1.default);
            if (updated instanceof Threat_1.default) {
                expect(updated.toJSON()).toBeDefined();
                expect(updated.id).toBe(threat.id);
                expect(updated.modelId).toBe(model.id);
                expect(updated.componentId).toBe(componentId);
                expect(updated.title).toBe("newtitle");
                expect(updated.createdBy).toBe("createdBy");
                expect(updated.suggestionId).toBe(undefined);
                expect(updated.description).toBe("baddesc");
            }
        }));
    });
});
//# sourceMappingURL=ThreatDataService.spec.js.map