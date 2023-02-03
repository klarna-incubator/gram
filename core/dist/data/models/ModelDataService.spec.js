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
const postgres_1 = require("../postgres");
const Threat_1 = __importDefault(require("../threats/Threat"));
const utils_1 = require("../utils");
const Model_1 = __importDefault(require("./Model"));
const ModelDataService_1 = require("./ModelDataService");
describe("ModelDataService implementation", () => {
    let data;
    let dal;
    let pool;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        pool = yield (0, postgres_1.createPostgresPool)();
        dal = new dal_1.DataAccessLayer(pool);
        data = new ModelDataService_1.ModelDataService(pool, dal);
        yield (0, utils_1._deleteAllTheThings)(pool);
    }));
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        yield (0, utils_1._deleteAllTheThings)(pool);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield pool.end();
    }));
    describe("getById model", () => {
        it("should return a valid model", () => __awaiter(void 0, void 0, void 0, function* () {
            const model = new Model_1.default("some-system-id", "some-version", "root");
            model.data = { components: [], dataFlows: [] };
            model.id = yield data.create(model);
            const fetched = yield data.getById(model.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.toJSON()).toBeDefined();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.id).toBe(model.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.systemId).toBe("some-system-id");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.data).toEqual({
                components: [],
                dataFlows: [],
            });
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeGreaterThan(yesterday.getTime());
        }));
        it("should return null value by default", () => __awaiter(void 0, void 0, void 0, function* () {
            const model = yield data.getById((0, crypto_1.randomUUID)());
            expect(model).toBe(null);
        }));
    });
    describe("list", () => {
        it("should return user models", () => __awaiter(void 0, void 0, void 0, function* () {
            const model2 = new Model_1.default((0, crypto_1.randomUUID)(), "something-else", "root");
            yield data.create(model2);
            const models = yield data.list(ModelDataService_1.ModelFilter.User, {
                user: "root",
                systemId: "something",
                withSystems: true,
            });
            expect(models.length).toEqual(1);
            expect(models[0].id).toBeDefined();
            expect(models[0].systemId).toBeDefined();
            expect(models[0].version).toBeDefined();
            expect(models[0].data).toEqual({
                components: [],
                dataFlows: [],
            });
            expect(models[0].createdBy).toBeDefined();
            expect(models[0].createdAt).toBeDefined();
            expect(models[0].updatedAt).toBeDefined();
        }));
        it('should return models from "system" filter', () => __awaiter(void 0, void 0, void 0, function* () {
            const model = new Model_1.default("something", "something", "me");
            yield data.create(model);
            const model2 = new Model_1.default((0, crypto_1.randomUUID)(), "something-else", "me");
            yield data.create(model2);
            const models = yield data.list(ModelDataService_1.ModelFilter.System, {
                user: "root",
                systemId: "something",
                withSystems: true,
            });
            expect(models.length).toEqual(1);
            expect(models[0].id).toBeDefined();
            expect(models[0].systemId).toBeDefined();
            expect(models[0].version).toBeDefined();
            expect(models[0].data).toEqual({
                components: [],
                dataFlows: [],
            });
            expect(models[0].createdBy).toBeDefined();
            expect(models[0].createdAt).toBeDefined();
            expect(models[0].updatedAt).toBeDefined();
        }));
    });
    describe("delete", () => {
        it("should return false on deleting non-existent model", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield data.delete((0, crypto_1.randomUUID)());
            expect(res).toBeFalsy();
        }));
        it("should not delete other rows", () => __awaiter(void 0, void 0, void 0, function* () {
            const model = new Model_1.default((0, crypto_1.randomUUID)(), "whatever", "me");
            model.id = yield data.create(model);
            const res = yield data.delete((0, crypto_1.randomUUID)());
            expect(res).toBeFalsy();
            const fetched = yield data.getById(model.id);
            expect(fetched).toBeTruthy();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.version).toEqual(model.version);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdBy).toEqual(model.createdBy);
        }));
        it("should not be able to fetch deleted row", () => __awaiter(void 0, void 0, void 0, function* () {
            const model = new Model_1.default((0, crypto_1.randomUUID)(), "whatever", "me");
            model.id = yield data.create(model);
            const res = yield data.delete(model.id);
            expect(res).toBeTruthy();
            const fetched = yield data.getById(model.id);
            expect(fetched).toBeFalsy();
        }));
        it("should not be able to fetch deleted mitigation row", () => __awaiter(void 0, void 0, void 0, function* () {
            const model = new Model_1.default((0, crypto_1.randomUUID)(), "whatever", "me");
            model.id = yield data.create(model);
            const componentId = (0, crypto_1.randomUUID)();
            const threat = new Threat_1.default("tampering", "act of something", model.id, componentId, "erik");
            threat.id = yield dal.threatService.create(threat);
            const control = new Control_1.default("counter tampering", "sumting", true, model.id, componentId, "erik");
            control.id = yield dal.controlService.create(control);
            const mitigation = new Mitigation_1.default(threat.id, control.id, "erik");
            const res1 = yield dal.mitigationService.create(mitigation);
            expect(res1).toBeTruthy();
            const { threatId, controlId } = res1
                ? res1
                : { threatId: "", controlId: "" };
            const res = yield data.delete(model.id);
            expect(res).toBeTruthy();
            const fetched = yield data.getById(model.id);
            expect(fetched).toBeFalsy();
            const fetchedThreat = yield dal.threatService.getById(threatId);
            expect(fetchedThreat).toBeFalsy();
            const fetchedControl = yield dal.controlService.getById(controlId);
            expect(fetchedControl).toBeFalsy();
            const fetchedMitigation = yield dal.mitigationService.getById(threatId, controlId);
            expect(fetchedMitigation).toBeFalsy();
        }));
    });
    describe("update", () => {
        it("should be able to update existing model", () => __awaiter(void 0, void 0, void 0, function* () {
            const model = new Model_1.default("some-system-id", "some-version", "root");
            model.data = { components: [], dataFlows: [] };
            model.id = yield data.create(model);
            const componentId = (0, crypto_1.randomUUID)();
            model.data = {
                components: [
                    { id: componentId, x: 0, y: 0, type: "ee", name: "omegalul" },
                ],
                dataFlows: [],
            };
            const didUpdate = yield data.update(model.id, model);
            expect(didUpdate).toBeTruthy();
            const fetched = yield data.getById(model.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.toJSON()).toBeDefined();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.id).toBe(model.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.systemId).toBe("some-system-id");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.data).toEqual({
                components: [
                    { id: componentId, x: 0, y: 0, type: "ee", name: "omegalul" },
                ],
                dataFlows: [],
            });
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeGreaterThan(yesterday.getTime());
        }));
        it("should return false on no matching model", () => __awaiter(void 0, void 0, void 0, function* () {
            const model = new Model_1.default("some-system-id", "some-version", "root");
            model.data = { components: [], dataFlows: [] };
            model.id = yield data.create(model);
            model.data = {
                components: [
                    { id: (0, crypto_1.randomUUID)(), x: 0, y: 0, type: "ee", name: "omegalul" },
                ],
                dataFlows: [],
            };
            const didUpdate = yield data.update((0, crypto_1.randomUUID)(), model);
            expect(didUpdate).toBeFalsy();
        }));
    });
    describe("copy", () => {
        it("should create a copy of existing model", () => __awaiter(void 0, void 0, void 0, function* () {
            const systemId = (0, crypto_1.randomUUID)();
            const model = new Model_1.default(systemId, "whatever", "me");
            const component1Id = (0, crypto_1.randomUUID)();
            const component2Id = (0, crypto_1.randomUUID)();
            const datafFlowId = (0, crypto_1.randomUUID)();
            model.data = {
                components: [
                    { id: component1Id, x: 0, y: 0, type: "ee", name: "omegalul" },
                    { id: component2Id, x: 1, y: 1, type: "ds", name: "hello" },
                ],
                dataFlows: [
                    {
                        id: datafFlowId,
                        endComponent: { id: component1Id },
                        startComponent: { id: component2Id },
                        points: [0, 0],
                        bidirectional: false,
                    },
                ],
            };
            model.id = yield data.create(model);
            const threat1 = new Threat_1.default("tampering", "act of something", model.id, component1Id, "erik");
            threat1.id = yield dal.threatService.create(threat1);
            const control1 = new Control_1.default("counter tampering", "sumting", true, model.id, component1Id, "erik");
            control1.id = yield dal.controlService.create(control1);
            const mitigation1 = new Mitigation_1.default(threat1.id, control1.id, "erik");
            const res1 = yield dal.mitigationService.create(mitigation1);
            expect(res1).toBeTruthy();
            const threat2 = new Threat_1.default("tampering2", "act of something2", model.id, component2Id, "erik2");
            threat2.id = yield dal.threatService.create(threat2);
            const control2 = new Control_1.default("counter tampering2", "sumting2", false, model.id, component2Id, "erik2");
            control2.id = yield dal.controlService.create(control2);
            const mitigation2 = new Mitigation_1.default(threat2.id, control2.id, "erik2");
            const res2 = yield dal.mitigationService.create(mitigation2);
            expect(res2).toBeTruthy();
            const modelCopy = new Model_1.default(systemId, "nr2", "erik");
            const modelCopyId = yield data.copy(model.id, modelCopy);
            expect(modelCopyId).toBeTruthy();
            const resModelCopy = yield data.getById(modelCopyId);
            expect(resModelCopy.toJSON()).toBeDefined();
            expect(resModelCopy.id).toBe(modelCopyId);
            expect(resModelCopy.systemId).toBe(model.systemId);
            expect(resModelCopy.version).toBe("nr2");
            expect(resModelCopy.createdBy).toBe("erik");
            const component1CopyId = resModelCopy.data.components[0].id;
            const component2CopyId = resModelCopy.data.components[1].id;
            const dataFlowCopyId = resModelCopy.data.dataFlows[0].id;
            expect(resModelCopy.data).toEqual({
                components: [
                    { id: component1CopyId, x: 0, y: 0, type: "ee", name: "omegalul" },
                    { id: component2CopyId, x: 1, y: 1, type: "ds", name: "hello" },
                ],
                dataFlows: [
                    {
                        id: dataFlowCopyId,
                        endComponent: { id: component1CopyId },
                        startComponent: { id: component2CopyId },
                        points: [0, 0],
                        bidirectional: false,
                    },
                ],
            });
            const threatsCopy = yield dal.threatService.list(resModelCopy.id);
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(threatsCopy.length).toEqual(2);
            const firstThreatCopy = threatsCopy[0].componentId === component1CopyId
                ? threatsCopy[0]
                : threatsCopy[1];
            const secondThreatCopy = threatsCopy[0].componentId === component1CopyId
                ? threatsCopy[1]
                : threatsCopy[0];
            const threats1CopyId = threatsCopy[0].componentId === component1CopyId
                ? threatsCopy[0].id
                : threatsCopy[1].id;
            const threats2CopyId = threatsCopy[0].componentId === component1CopyId
                ? threatsCopy[1].id
                : threatsCopy[0].id;
            expect(firstThreatCopy.toJSON()).toBeDefined();
            expect(firstThreatCopy.id).toBe(threats1CopyId);
            expect(firstThreatCopy.modelId).toBe(resModelCopy.id);
            expect(firstThreatCopy.componentId).toBe(component1CopyId);
            expect(firstThreatCopy.title).toBe("tampering");
            expect(firstThreatCopy.createdBy).toBe("erik");
            expect(firstThreatCopy.suggestionId).toBe(undefined);
            expect(firstThreatCopy.description).toBe("act of something");
            expect(firstThreatCopy.createdAt).toBeLessThan(Date.now() + 1000);
            expect(firstThreatCopy.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(firstThreatCopy.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(firstThreatCopy.updatedAt).toBeGreaterThan(yesterday.getTime());
            expect(secondThreatCopy.toJSON()).toBeDefined();
            expect(secondThreatCopy.id).toBe(threats2CopyId);
            expect(secondThreatCopy.modelId).toBe(resModelCopy.id);
            expect(secondThreatCopy.componentId).toBe(component2CopyId);
            expect(secondThreatCopy.title).toBe("tampering2");
            expect(secondThreatCopy.createdBy).toBe("erik2");
            expect(secondThreatCopy.description).toBe("act of something2");
            expect(secondThreatCopy.suggestionId).toBe(undefined);
            expect(secondThreatCopy.createdAt).toBeLessThan(Date.now() + 1000);
            expect(secondThreatCopy.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(secondThreatCopy.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(secondThreatCopy.updatedAt).toBeGreaterThan(yesterday.getTime());
            const controlsCopy = yield dal.controlService.list(resModelCopy.id);
            expect(controlsCopy.length).toEqual(2);
            const firstControlCopy = controlsCopy[0].componentId === component1CopyId
                ? controlsCopy[0]
                : controlsCopy[1];
            const secondControlCopy = controlsCopy[0].componentId === component1CopyId
                ? controlsCopy[1]
                : controlsCopy[0];
            const controls1CopyId = controlsCopy[0].componentId === component1CopyId
                ? controlsCopy[0].id
                : controlsCopy[1].id;
            const controls2CopyId = controlsCopy[0].componentId === component1CopyId
                ? controlsCopy[1].id
                : controlsCopy[0].id;
            expect(firstControlCopy.toJSON()).toBeDefined();
            expect(firstControlCopy.id).toBe(controls1CopyId);
            expect(firstControlCopy.modelId).toBe(resModelCopy.id);
            expect(firstControlCopy.componentId).toBe(component1CopyId);
            expect(firstControlCopy.title).toBe("counter tampering");
            expect(firstControlCopy.inPlace).toBe(true);
            expect(firstControlCopy.createdBy).toBe("erik");
            expect(firstControlCopy.suggestionId).toBe(undefined);
            expect(firstControlCopy.description).toBe("sumting");
            expect(firstControlCopy.createdAt).toBeLessThan(Date.now() + 1000);
            expect(firstControlCopy.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(firstControlCopy.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(firstControlCopy.updatedAt).toBeGreaterThan(yesterday.getTime());
            expect(secondControlCopy.toJSON()).toBeDefined();
            expect(secondControlCopy.id).toBe(controls2CopyId);
            expect(secondControlCopy.modelId).toBe(resModelCopy.id);
            expect(secondControlCopy.componentId).toBe(component2CopyId);
            expect(secondControlCopy.title).toBe("counter tampering2");
            expect(secondControlCopy.createdBy).toBe("erik2");
            expect(secondControlCopy.inPlace).toBe(false);
            expect(secondControlCopy.description).toBe("sumting2");
            expect(secondControlCopy.suggestionId).toBe(undefined);
            expect(secondControlCopy.createdAt).toBeLessThan(Date.now() + 1000);
            expect(secondControlCopy.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(secondControlCopy.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(secondControlCopy.updatedAt).toBeGreaterThan(yesterday.getTime());
            const mitigationsCopy = yield dal.mitigationService.list(resModelCopy.id);
            expect(mitigationsCopy.length).toEqual(2);
            const firstMitigationCopy = mitigationsCopy[0].threatId === threats1CopyId
                ? mitigationsCopy[0]
                : mitigationsCopy[1];
            const secondMitigationCopy = mitigationsCopy[0].threatId === threats1CopyId
                ? mitigationsCopy[1]
                : mitigationsCopy[0];
            expect(firstMitigationCopy.toJSON()).toBeDefined();
            expect(firstMitigationCopy.threatId).toBe(threats1CopyId);
            expect(firstMitigationCopy.controlId).toBe(controls1CopyId);
            expect(firstMitigationCopy.createdBy).toBe("erik");
            expect(firstMitigationCopy.createdAt).toBeLessThan(Date.now() + 1000);
            expect(firstMitigationCopy.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(firstMitigationCopy.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(firstMitigationCopy.updatedAt).toBeGreaterThan(yesterday.getTime());
            expect(secondMitigationCopy.toJSON()).toBeDefined();
            expect(secondMitigationCopy.threatId).toBe(threats2CopyId);
            expect(secondMitigationCopy.controlId).toBe(controls2CopyId);
            expect(secondMitigationCopy.createdBy).toBe("erik2");
            expect(secondMitigationCopy.createdAt).toBeLessThan(Date.now() + 1000);
            expect(secondMitigationCopy.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(secondMitigationCopy.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(secondMitigationCopy.updatedAt).toBeGreaterThan(yesterday.getTime());
        }));
        it("should return null on no matching srcModel", () => __awaiter(void 0, void 0, void 0, function* () {
            const modelCopy = new Model_1.default((0, crypto_1.randomUUID)(), "nr2", "erik");
            const modelCopyId = yield data.copy((0, crypto_1.randomUUID)(), modelCopy);
            expect(modelCopyId).toBeFalsy();
        }));
    });
});
//# sourceMappingURL=ModelDataService.spec.js.map