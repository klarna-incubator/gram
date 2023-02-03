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
const dal_1 = require("../dal");
const Mitigation_1 = __importDefault(require("../mitigations/Mitigation"));
const Model_1 = __importDefault(require("../models/Model"));
const postgres_1 = require("../postgres");
const Threat_1 = __importDefault(require("../threats/Threat"));
const utils_1 = require("../utils");
const Control_1 = __importDefault(require("./Control"));
const ControlDataService_1 = require("./ControlDataService");
describe("ControlDataService implementation", () => {
    let data;
    let dal;
    let pool;
    let model;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        pool = yield (0, postgres_1.createPostgresPool)();
        dal = new dal_1.DataAccessLayer(pool);
        data = new ControlDataService_1.ControlDataService(pool, dal);
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
    describe("getById control", () => {
        it("should return a valid control", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const control = new Control_1.default("title", "description", true, model.id, componentId, "createdBy");
            control.id = yield data.create(control);
            const fetched = yield data.getById(control.id);
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.toJSON()).toBeDefined();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.id).toBe(control.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.modelId).toBe(model.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.componentId).toBe(componentId);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.title).toBe("title");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.inPlace).toBe(true);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdBy).toBe("createdBy");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.suggestionId).toBe(undefined);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.description).toBe("description");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeGreaterThan(yesterday.getTime());
        }));
        it("should return null value by default", () => __awaiter(void 0, void 0, void 0, function* () {
            const control = yield data.getById((0, crypto_1.randomUUID)());
            expect(control).toBe(null);
        }));
    });
    describe("list controls", () => {
        it("should return controls of model", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const control1 = new Control_1.default("title1", "description1", true, model.id, componentId, "createdBy1");
            control1.id = yield data.create(control1);
            const control2 = new Control_1.default("title2", "description2", false, model.id, componentId, "createdBy2");
            control2.id = yield data.create(control2);
            const controls = yield data.list(model.id);
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(controls.length).toEqual(2);
            expect(controls[0].toJSON()).toBeDefined();
            expect(controls[0].id).toBe(control2.id);
            expect(controls[0].modelId).toBe(model.id);
            expect(controls[0].componentId).toBe(componentId);
            expect(controls[0].title).toBe("title2");
            expect(controls[0].inPlace).toBe(false);
            expect(controls[0].createdBy).toBe("createdBy2");
            expect(controls[0].suggestionId).toBe(undefined);
            expect(controls[0].description).toBe("description2");
            expect(controls[0].createdAt).toBeLessThan(Date.now() + 1000);
            expect(controls[0].createdAt).toBeGreaterThan(yesterday.getTime());
            expect(controls[0].updatedAt).toBeLessThan(Date.now() + 1000);
            expect(controls[0].updatedAt).toBeGreaterThan(yesterday.getTime());
            expect(controls[1].toJSON()).toBeDefined();
            expect(controls[1].id).toBe(control1.id);
            expect(controls[1].modelId).toBe(model.id);
            expect(controls[1].componentId).toBe(componentId);
            expect(controls[1].title).toBe("title1");
            expect(controls[1].inPlace).toBe(true);
            expect(controls[1].createdBy).toBe("createdBy1");
            expect(controls[1].description).toBe("description1");
            expect(controls[1].suggestionId).toBe(undefined);
            expect(controls[1].createdAt).toBeLessThan(Date.now() + 1000);
            expect(controls[1].createdAt).toBeGreaterThan(yesterday.getTime());
            expect(controls[1].updatedAt).toBeLessThan(Date.now() + 1000);
            expect(controls[1].updatedAt).toBeGreaterThan(yesterday.getTime());
        }));
        it("should return empty list by default", () => __awaiter(void 0, void 0, void 0, function* () {
            const controls = yield data.list((0, crypto_1.randomUUID)());
            expect(controls).toEqual([]);
        }));
    });
    describe("delete control", () => {
        it("should return false on deleting non-existent control", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield data.delete(model.id, (0, crypto_1.randomUUID)());
            expect(res).toBeFalsy();
        }));
        it("should not delete other rows", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const control = new Control_1.default("title", "description", true, model.id, componentId, "createdBy");
            control.id = yield data.create(control);
            const res = yield data.delete(model.id, (0, crypto_1.randomUUID)());
            expect(res).toBeFalsy();
            const fetched = yield data.getById(control.id);
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(fetched).toBeTruthy();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.toJSON()).toBeDefined();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.id).toBe(control.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.modelId).toBe(model.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.componentId).toBe(componentId);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.title).toBe("title");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.inPlace).toBe(true);
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
            const control = new Control_1.default("title", "description", true, model.id, componentId, "createdBy");
            control.id = yield data.create(control);
            const res = yield data.delete(model.id, control.id);
            expect(res).toBeTruthy();
            const fetched = yield data.getById(control.id);
            expect(fetched).toBeFalsy();
        }));
        it("should delete associated mitigations", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const control = new Control_1.default("title", "description", true, model.id, componentId, "createdBy");
            control.id = yield data.create(control);
            const control2 = new Control_1.default("title2", "description2", false, model.id, componentId, "createdBy2");
            control2.id = yield data.create(control2);
            const threat = new Threat_1.default("title2threat", "description2threat", model.id, componentId, "createdBy2threat");
            threat.id = yield dal.threatService.create(threat);
            const mitigation = new Mitigation_1.default(threat.id, control.id, "createdBy2threat1");
            const res1 = yield dal.mitigationService.create(mitigation);
            expect(res1).toBeTruthy();
            const { threatId, controlId } = res1
                ? res1
                : { threatId: "", controlId: "" };
            const mitigation2 = new Mitigation_1.default(threat.id, control2.id, "createdBy2threat3");
            const res2 = yield dal.mitigationService.create(mitigation2);
            expect(res2).toBeTruthy();
            const control2Id = res2.controlId;
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
            const res = yield data.delete(model.id, controlId);
            expect(res).toBeTruthy();
            const fetchDeleted = yield dal.mitigationService.getById(threatId, controlId);
            expect(fetchDeleted).toBe(null);
            let fetched = yield dal.mitigationService.getById(threatId, control2Id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.toJSON()).toBeDefined();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.threatId).toBe(threatId);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.controlId).toBe(control2Id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdBy).toBe("createdBy2threat3");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeGreaterThan(yesterday.getTime());
        }));
    });
    describe("update control", () => {
        it("should return false on deleting non-existent control", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const control = new Control_1.default("title", "description", true, model.id, componentId, "createdBy");
            control.id = yield data.create(control);
            const fetched = yield data.getById(control.id);
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.toJSON()).toBeDefined();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.id).toBe(control.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.modelId).toBe(model.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.componentId).toBe(componentId);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.title).toBe("title");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.inPlace).toBe(true);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdBy).toBe("createdBy");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.suggestionId).toBe(undefined);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.description).toBe("description");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeGreaterThan(yesterday.getTime());
            const updated = yield data.update(model.id, control.id, {
                inPlace: false,
                title: "newtitle",
                description: "baddesc",
            });
            expect(updated).toBeInstanceOf(Control_1.default);
            if (updated instanceof Control_1.default) {
                expect(updated.toJSON()).toBeDefined();
                expect(updated.id).toBe(control.id);
                expect(updated.modelId).toBe(model.id);
                expect(updated.componentId).toBe(componentId);
                expect(updated.title).toBe("newtitle");
                expect(updated.inPlace).toBe(false);
                expect(updated.createdBy).toBe("createdBy");
                expect(updated.suggestionId).toBe(undefined);
                expect(updated.description).toBe("baddesc");
            }
        }));
    });
});
//# sourceMappingURL=ControlDataService.spec.js.map