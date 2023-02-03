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
const Model_1 = __importDefault(require("../models/Model"));
const postgres_1 = require("../postgres");
const Threat_1 = __importDefault(require("../threats/Threat"));
const utils_1 = require("../utils");
const Mitigation_1 = __importDefault(require("./Mitigation"));
const MitigationDataService_1 = require("./MitigationDataService");
describe("MitigationDataService implementation", () => {
    let data;
    let dal;
    let pool;
    let model;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        pool = yield (0, postgres_1.createPostgresPool)();
        data = new MitigationDataService_1.MitigationDataService(pool);
        dal = new dal_1.DataAccessLayer(pool);
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
    describe("getById mitigation", () => {
        it("should return a valid mitigation", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const control = new Control_1.default("title", "description", true, model.id, componentId, "createdBy");
            control.id = yield dal.controlService.create(control);
            const threat = new Threat_1.default("title", "description", model.id, componentId, "createdBy");
            threat.id = yield dal.threatService.create(threat);
            const mitigation = new Mitigation_1.default(threat.id, control.id, "creator");
            const res1 = yield data.create(mitigation);
            expect(res1).toBeTruthy();
            const { threatId, controlId } = res1
                ? res1
                : { threatId: "", controlId: "" };
            const fetched = yield data.getById(threatId, controlId);
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.toJSON()).toBeDefined();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.threatId).toBe(threat.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.controlId).toBe(control.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdBy).toBe("creator");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeGreaterThan(yesterday.getTime());
        }));
        it("should return null value by default", () => __awaiter(void 0, void 0, void 0, function* () {
            const mitigation = yield data.getById((0, crypto_1.randomUUID)(), (0, crypto_1.randomUUID)());
            expect(mitigation).toBe(null);
        }));
    });
    describe("list mitigations", () => {
        it("should return a list of mitigations", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const control = new Control_1.default("title", "description", true, model.id, componentId, "createdBy");
            control.id = yield dal.controlService.create(control);
            const control2 = new Control_1.default("title2", "description2", false, model.id, componentId, "createdBy2");
            control2.id = yield dal.controlService.create(control2);
            const threat = new Threat_1.default("title", "description", model.id, componentId, "createdBy");
            threat.id = yield dal.threatService.create(threat);
            const mitigation = new Mitigation_1.default(threat.id, control.id, "creator");
            const res1 = yield data.create(mitigation);
            expect(res1).toBeTruthy();
            const { threatId, controlId } = res1
                ? res1
                : { threatId: "", controlId: "" };
            const mitigation2 = new Mitigation_1.default(threat.id, control2.id, "creator1");
            const res2 = yield data.create(mitigation2);
            expect(res2).toBeTruthy();
            const { controlId: control2Id } = res2 ? res2 : { controlId: "" };
            const mitigations = yield data.list(model.id);
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(mitigations.length).toEqual(2);
            expect(mitigations[0].toJSON()).toBeDefined();
            expect(mitigations[0].threatId).toBe(threatId);
            expect(mitigations[0].controlId).toBe(controlId);
            expect(mitigations[0].createdBy).toBe("creator");
            expect(mitigations[0].createdAt).toBeLessThan(Date.now() + 1000);
            expect(mitigations[0].createdAt).toBeGreaterThan(yesterday.getTime());
            expect(mitigations[0].updatedAt).toBeLessThan(Date.now() + 1000);
            expect(mitigations[0].updatedAt).toBeGreaterThan(yesterday.getTime());
            expect(mitigations[1].toJSON()).toBeDefined();
            expect(mitigations[1].threatId).toBe(threatId);
            expect(mitigations[1].controlId).toBe(control2Id);
            expect(mitigations[1].createdBy).toBe("creator1");
            expect(mitigations[1].createdAt).toBeLessThan(Date.now() + 1000);
            expect(mitigations[1].createdAt).toBeGreaterThan(yesterday.getTime());
            expect(mitigations[1].updatedAt).toBeLessThan(Date.now() + 1000);
            expect(mitigations[1].updatedAt).toBeGreaterThan(yesterday.getTime());
        }));
        it("should return empty list by default", () => __awaiter(void 0, void 0, void 0, function* () {
            const mitigations = yield data.list((0, crypto_1.randomUUID)());
            expect(mitigations).toEqual([]);
        }));
    });
    describe("delete mitigation", () => {
        it("should return false on deleting non-existent mitigation", () => __awaiter(void 0, void 0, void 0, function* () {
            const res = yield data.delete((0, crypto_1.randomUUID)(), (0, crypto_1.randomUUID)());
            expect(res).toBeFalsy();
        }));
        it("should not delete other rows", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const control = new Control_1.default("title", "description", true, model.id, componentId, "createdBy");
            control.id = yield dal.controlService.create(control);
            const threat = new Threat_1.default("title", "description", model.id, componentId, "createdBy");
            threat.id = yield dal.threatService.create(threat);
            const mitigation = new Mitigation_1.default(threat.id, control.id, "creator");
            const res1 = yield data.create(mitigation);
            expect(res1).toBeTruthy();
            const { threatId, controlId } = res1
                ? res1
                : { threatId: "", controlId: "" };
            const res = yield data.delete(threatId, (0, crypto_1.randomUUID)());
            expect(res).toBeFalsy();
            const fetched = yield data.getById(threatId, controlId);
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.toJSON()).toBeDefined();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.threatId).toBe(threat.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.controlId).toBe(control.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdBy).toBe("creator");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeGreaterThan(yesterday.getTime());
        }));
        it("should not be able to fetch deleted row", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const control = new Control_1.default("title", "description", true, model.id, componentId, "createdBy");
            control.id = yield dal.controlService.create(control);
            const threat = new Threat_1.default("title", "description", model.id, componentId, "createdBy");
            threat.id = yield dal.threatService.create(threat);
            const mitigation = new Mitigation_1.default(threat.id, control.id, "creator");
            const res1 = yield data.create(mitigation);
            expect(res1).toBeTruthy();
            const { threatId, controlId } = res1
                ? res1
                : { threatId: "", controlId: "" };
            const res = yield data.delete(threatId, controlId);
            expect(res).toBeTruthy();
            const fetched = yield data.getById(threatId, controlId);
            expect(fetched).toBeFalsy();
        }));
        it("should be able to un-delete a mitigation", () => __awaiter(void 0, void 0, void 0, function* () {
            const componentId = (0, crypto_1.randomUUID)();
            const control = new Control_1.default("title", "description", true, model.id, componentId, "createdBy");
            control.id = yield dal.controlService.create(control);
            const threat = new Threat_1.default("title", "description", model.id, componentId, "createdBy");
            threat.id = yield dal.threatService.create(threat);
            const mitigation = new Mitigation_1.default(threat.id, control.id, "creator");
            const res1 = yield data.create(mitigation);
            expect(res1).toBeTruthy();
            const { threatId, controlId } = res1
                ? res1
                : { threatId: "", controlId: "" };
            const res = yield data.delete(threatId, controlId);
            expect(res).toBeTruthy();
            const mitigationNew = new Mitigation_1.default(threatId, controlId, "Anotherone");
            const res2 = yield data.create(mitigationNew);
            expect(res2).toBeTruthy();
            const { threatId: newThreatId, controlId: newControlId } = res2
                ? res2
                : { threatId: "", controlId: "" };
            const fetched = yield data.getById(newThreatId, newControlId);
            const today = new Date(Date.now());
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.toJSON()).toBeDefined();
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.threatId).toBe(threat.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.controlId).toBe(control.id);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdBy).toBe("Anotherone");
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.createdAt).toBeGreaterThan(yesterday.getTime());
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeLessThan(Date.now() + 1000);
            expect(fetched === null || fetched === void 0 ? void 0 : fetched.updatedAt).toBeGreaterThan(yesterday.getTime());
        }));
    });
});
//# sourceMappingURL=MitigationDataService.spec.js.map