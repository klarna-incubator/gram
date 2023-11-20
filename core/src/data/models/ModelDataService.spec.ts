import { randomUUID } from "crypto";
import pg from "pg";
import Control from "../controls/Control.js";
import { DataAccessLayer } from "../dal.js";
import Mitigation from "../mitigations/Mitigation.js";
import { createPostgresPool } from "../postgres.js";
import Threat from "../threats/Threat.js";
import { _deleteAllTheThings } from "../utils.js";
import Model from "./Model.js";
import { ModelDataService, ModelFilter } from "./ModelDataService.js";
import {
  genSuggestedControl,
  genSuggestedThreat,
} from "../../test-util/suggestions.js";
import { sampleUser } from "../../test-util/sampleUser.js";

describe("ModelDataService implementation", () => {
  let data: ModelDataService;
  let dal: DataAccessLayer;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    data = new ModelDataService(dal);
  });

  afterEach(async () => {
    await _deleteAllTheThings(dal);
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  describe("getById model", () => {
    it("should return a valid model", async () => {
      const model = new Model("some-system-id", "some-version", "root");
      model.data = { components: [], dataFlows: [] };
      model.id = await data.create(model);

      const fetched = await data.getById(model.id!);
      expect(fetched?.toJSON()).toBeDefined();
      expect(fetched?.id).toBe(model.id);
      expect(fetched?.systemId).toBe("some-system-id");
      expect(fetched?.data).toEqual({
        components: [],
        dataFlows: [],
      });
      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(fetched?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(fetched?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt).toBeGreaterThan(yesterday.getTime());
    });

    it("should return null value by default", async () => {
      const model = await data.getById(randomUUID());
      expect(model).toBe(null);
    });
  });

  describe("list", () => {
    it("should return user models", async () => {
      const model2 = new Model(randomUUID(), "something-else", "root");
      await data.create(model2);
      const models = await data.list(ModelFilter.User, {
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
    });

    it('should return models from "system" filter', async () => {
      const model = new Model("something", "something", "me");
      await data.create(model);
      const model2 = new Model(randomUUID(), "something-else", "me");
      await data.create(model2);
      const models = await data.list(ModelFilter.System, {
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
    });
  });

  describe("delete", () => {
    it("should return false on deleting non-existent model", async () => {
      const res = await data.delete(randomUUID());
      expect(res).toBeFalsy();
    });
    it("should not delete other rows", async () => {
      const model = new Model(randomUUID(), "whatever", "me");
      model.id = await data.create(model);
      const res = await data.delete(randomUUID());
      expect(res).toBeFalsy();
      const fetched = await data.getById(model.id!);
      expect(fetched).toBeTruthy();
      expect(fetched?.version).toEqual(model.version);
      expect(fetched?.createdBy).toEqual(model.createdBy);
    });
    it("should not be able to fetch deleted row", async () => {
      const model = new Model(randomUUID(), "whatever", "me");
      model.id = await data.create(model);
      const res = await data.delete(model.id!);
      expect(res).toBeTruthy();
      const fetched = await data.getById(model.id!);
      expect(fetched).toBeFalsy();
    });
    it("should not be able to fetch deleted mitigation row", async () => {
      const model = new Model(randomUUID(), "whatever", "me");
      model.id = await data.create(model);

      const componentId = randomUUID();
      const threat = new Threat(
        "tampering",
        "act of something",
        model.id!,
        componentId,
        "erik"
      );
      threat.id = await dal.threatService.create(threat);
      const control = new Control(
        "counter tampering",
        "sumting",
        true,
        model.id!,
        componentId,
        "erik"
      );
      control.id = await dal.controlService.create(control);
      const mitigation = new Mitigation(threat.id!, control.id!, "erik");
      const res1 = await dal.mitigationService.create(mitigation);
      expect(res1).toBeTruthy();
      const { threatId, controlId } = res1
        ? res1
        : { threatId: "", controlId: "" };

      const res = await data.delete(model.id!);
      expect(res).toBeTruthy();

      const fetched = await data.getById(model.id!);
      expect(fetched).toBeFalsy();

      const fetchedThreat = await dal.threatService.getById(threatId);
      expect(fetchedThreat).toBeFalsy();
      const fetchedControl = await dal.controlService.getById(controlId);
      expect(fetchedControl).toBeFalsy();
      const fetchedMitigation = await dal.mitigationService.getById(
        threatId,
        controlId
      );
      expect(fetchedMitigation).toBeFalsy();
    });
  });

  describe("update", () => {
    it("should be able to update existing model", async () => {
      const model = new Model("some-system-id", "some-version", "root");
      model.data = { components: [], dataFlows: [] };
      model.id = await data.create(model);

      const componentId = randomUUID();
      model.data = {
        components: [
          { id: componentId, x: 0, y: 0, type: "ee", name: "omegalul" },
        ],
        dataFlows: [],
      };
      const didUpdate = await data.update(model.id!, model);
      expect(didUpdate).toBeTruthy();
      const fetched = await data.getById(model.id!);
      expect(fetched?.toJSON()).toBeDefined();
      expect(fetched?.id).toBe(model.id);
      expect(fetched?.systemId).toBe("some-system-id");
      expect(fetched?.data).toEqual({
        components: [
          { id: componentId, x: 0, y: 0, type: "ee", name: "omegalul" },
        ],
        dataFlows: [],
      });
      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(fetched?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(fetched?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt).toBeGreaterThan(yesterday.getTime());
    });
    it("should return false on no matching model", async () => {
      const model = new Model("some-system-id", "some-version", "root");
      model.data = { components: [], dataFlows: [] };
      model.id = await data.create(model);

      model.data = {
        components: [
          { id: randomUUID(), x: 0, y: 0, type: "ee", name: "omegalul" },
        ],
        dataFlows: [],
      };
      const didUpdate = await data.update(randomUUID(), model);
      expect(didUpdate).toBeFalsy();
    });
  });

  describe("copy", () => {
    it("should create a copy of existing model", async () => {
      const systemId = randomUUID();
      const model = new Model(systemId, "whatever", "me");
      const component1Id = randomUUID();
      const component2Id = randomUUID();
      const datafFlowId = randomUUID();
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
      model.id = await data.create(model);

      const threat1 = new Threat(
        "tampering",
        "act of something",
        model.id!,
        component1Id,
        "erik"
      );
      threat1.id = await dal.threatService.create(threat1);
      await dal.threatService.update(model.id!, threat1.id!, {
        isActionItem: true,
      });
      const control1 = new Control(
        "counter tampering",
        "sumting",
        true,
        model.id!,
        component1Id,
        "erik"
      );
      control1.id = await dal.controlService.create(control1);
      const mitigation1 = new Mitigation(threat1.id!, control1.id!, "erik");
      const res1 = await dal.mitigationService.create(mitigation1);
      expect(res1).toBeTruthy();

      const threat2 = new Threat(
        "tampering2",
        "act of something2",
        model.id!,
        component2Id,
        "erik2"
      );
      threat2.id = await dal.threatService.create(threat2);
      const control2 = new Control(
        "counter tampering2",
        "sumting2",
        false,
        model.id!,
        component2Id,
        "erik2"
      );
      control2.id = await dal.controlService.create(control2);
      const mitigation2 = new Mitigation(threat2.id!, control2.id!, "erik2");
      const res2 = await dal.mitigationService.create(mitigation2);
      expect(res2).toBeTruthy();

      // Suggestions
      const threatSuggestion = genSuggestedThreat(component2Id);
      await dal.suggestionService.bulkInsert(model.id!, {
        threats: [threatSuggestion],
        controls: [
          genSuggestedControl({
            componentId: component2Id,
            mitigates: [{ partialThreatId: threatSuggestion.id.partialId }],
          }),
        ],
      });
      const threatSuggestionsOriginal =
        await dal.suggestionService.listThreatSuggestions(model.id!);
      const controlSuggestionsOriginal =
        await dal.suggestionService.listControlSuggestions(model.id!);

      await dal.suggestionService.acceptSuggestion(
        model.id!,
        threatSuggestionsOriginal[0].id,
        sampleUser.sub
      );
      await dal.suggestionService.acceptSuggestion(
        model.id!,
        controlSuggestionsOriginal[0].id,
        sampleUser.sub
      );

      const modelCopy = new Model(systemId, "nr2", "erik");
      const modelCopyId = await data.copy(model.id!, modelCopy);
      expect(modelCopyId).toBeTruthy();
      const resModelCopy = await data.getById(modelCopyId!);
      expect(resModelCopy!.toJSON()).toBeDefined();
      expect(resModelCopy!.id).toBe(modelCopyId);
      expect(resModelCopy!.systemId).toBe(model.systemId);
      expect(resModelCopy!.version).toBe("nr2");
      expect(resModelCopy!.createdBy).toBe("erik");

      const component1CopyId = resModelCopy!.data.components[0].id;
      const component2CopyId = resModelCopy!.data.components[1].id;
      const dataFlowCopyId = resModelCopy!.data.dataFlows[0].id;

      expect(resModelCopy!.data).toEqual({
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

      // Suggestions
      const threatSuggestions =
        await dal.suggestionService.listThreatSuggestions(modelCopyId!);
      expect(threatSuggestions.length).toBe(1);
      expect(threatSuggestions[0].componentId).toBe(component2CopyId);
      const controlSuggestions =
        await dal.suggestionService.listControlSuggestions(modelCopyId!);
      expect(controlSuggestions.length).toBe(1);
      expect(controlSuggestions[0].componentId).toBe(component2CopyId);

      const threatsCopy = await dal.threatService.list(resModelCopy!.id!);

      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(threatsCopy.length).toEqual(3); // 3rd mitigation is the suggested control/threat

      const suggestedThreat = threatsCopy.find((t) => t.suggestionId);
      expect(suggestedThreat).toBeTruthy();

      const firstThreatCopy = threatsCopy.find(
        (t) => t.title === threat1.title
      );
      const secondThreatCopy = threatsCopy.find(
        (t) => t.title === threat2.title
      );

      expect(firstThreatCopy?.toJSON()).toBeDefined();
      expect(firstThreatCopy?.modelId).toBe(resModelCopy!.id);
      expect(firstThreatCopy?.componentId).toBe(component1CopyId);
      expect(firstThreatCopy?.title).toBe("tampering");
      expect(firstThreatCopy?.isActionItem).toBe(true);
      expect(firstThreatCopy?.createdBy).toBe("erik");
      expect(firstThreatCopy?.suggestionId).toBe(undefined);
      expect(firstThreatCopy?.description).toBe("act of something");
      expect(firstThreatCopy?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(firstThreatCopy?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(firstThreatCopy?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(firstThreatCopy?.updatedAt).toBeGreaterThan(yesterday.getTime());

      expect(secondThreatCopy?.toJSON()).toBeDefined();
      expect(secondThreatCopy?.modelId).toBe(resModelCopy!.id);
      expect(secondThreatCopy?.componentId).toBe(component2CopyId);
      expect(secondThreatCopy?.title).toBe("tampering2");
      expect(secondThreatCopy?.createdBy).toBe("erik2");
      expect(secondThreatCopy?.description).toBe("act of something2");
      expect(secondThreatCopy?.suggestionId).toBe(undefined);
      expect(secondThreatCopy?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(secondThreatCopy?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(secondThreatCopy?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(secondThreatCopy?.updatedAt).toBeGreaterThan(yesterday.getTime());

      const controlsCopy = await dal.controlService.list(resModelCopy!.id!);

      const suggestedControl = controlsCopy.find((t) => t.suggestionId);
      expect(suggestedControl).toBeTruthy();

      expect(controlsCopy.length).toEqual(3);

      const firstControlCopy = controlsCopy.find(
        (c) => c.title === control1.title
      );
      const secondControlCopy = controlsCopy.find(
        (c) => c.title === control2.title
      );

      expect(firstControlCopy?.toJSON()).toBeDefined();
      expect(firstControlCopy?.modelId).toBe(resModelCopy!.id);
      expect(firstControlCopy?.componentId).toBe(component1CopyId);
      expect(firstControlCopy?.title).toBe("counter tampering");
      expect(firstControlCopy?.inPlace).toBe(true);
      expect(firstControlCopy?.createdBy).toBe("erik");
      expect(firstControlCopy?.suggestionId).toBe(undefined);
      expect(firstControlCopy?.description).toBe("sumting");
      expect(firstControlCopy?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(firstControlCopy?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(firstControlCopy?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(firstControlCopy?.updatedAt).toBeGreaterThan(yesterday.getTime());

      expect(secondControlCopy?.toJSON()).toBeDefined();
      expect(secondControlCopy?.modelId).toBe(resModelCopy!.id);
      expect(secondControlCopy?.componentId).toBe(component2CopyId);
      expect(secondControlCopy?.title).toBe("counter tampering2");
      expect(secondControlCopy?.createdBy).toBe("erik2");
      expect(secondControlCopy?.inPlace).toBe(false);
      expect(secondControlCopy?.description).toBe("sumting2");
      expect(secondControlCopy?.suggestionId).toBe(undefined);
      expect(secondControlCopy?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(secondControlCopy?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(secondControlCopy?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(secondControlCopy?.updatedAt).toBeGreaterThan(yesterday.getTime());

      const mitigationsCopy = await dal.mitigationService.list(
        resModelCopy!.id!
      );

      expect(mitigationsCopy.length).toEqual(3);

      const firstMitigationCopy = mitigationsCopy.find(
        (m) => m.threatId === firstThreatCopy?.id
      );

      const secondMitigationCopy = mitigationsCopy.find(
        (m) => m.threatId === secondThreatCopy?.id
      );

      expect(firstMitigationCopy?.toJSON()).toBeDefined();
      expect(firstMitigationCopy?.threatId).toBe(firstThreatCopy?.id);
      expect(firstMitigationCopy?.controlId).toBe(firstControlCopy?.id);
      expect(firstMitigationCopy?.createdBy).toBe("erik");
      expect(firstMitigationCopy?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(firstMitigationCopy?.createdAt).toBeGreaterThan(
        yesterday.getTime()
      );
      expect(firstMitigationCopy?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(firstMitigationCopy?.updatedAt).toBeGreaterThan(
        yesterday.getTime()
      );

      expect(secondMitigationCopy?.toJSON()).toBeDefined();
      expect(secondMitigationCopy?.threatId).toBe(secondThreatCopy?.id);
      expect(secondMitigationCopy?.controlId).toBe(secondControlCopy?.id);
      expect(secondMitigationCopy?.createdBy).toBe("erik2");
      expect(secondMitigationCopy?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(secondMitigationCopy?.createdAt).toBeGreaterThan(
        yesterday.getTime()
      );
      expect(secondMitigationCopy?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(secondMitigationCopy?.updatedAt).toBeGreaterThan(
        yesterday.getTime()
      );
    });

    it("should not crash if original model has deleted threats/controls", async () => {
      const systemId = randomUUID();
      const model = new Model(systemId, "whatever", "me");
      const component1Id = randomUUID();
      const component2Id = randomUUID();
      const datafFlowId = randomUUID();
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
      model.id = await data.create(model);

      const threat1 = new Threat(
        "tampering",
        "act of something",
        model.id!,
        component1Id,
        "erik"
      );
      threat1.id = await dal.threatService.create(threat1);
      await dal.threatService.update(model.id!, threat1.id!, {
        isActionItem: true,
      });
      const control1 = new Control(
        "counter tampering",
        "sumting",
        true,
        model.id!,
        component1Id,
        "erik"
      );
      control1.id = await dal.controlService.create(control1);
      const mitigation1 = new Mitigation(threat1.id!, control1.id!, "erik");
      const res1 = await dal.mitigationService.create(mitigation1);
      expect(res1).toBeTruthy();

      const threat2 = new Threat(
        "tampering2",
        "act of something2",
        model.id!,
        component2Id,
        "erik2"
      );
      threat2.id = await dal.threatService.create(threat2);
      const control2 = new Control(
        "counter tampering2",
        "sumting2",
        false,
        model.id!,
        component2Id,
        "erik2"
      );
      control2.id = await dal.controlService.create(control2);
      const mitigation2 = new Mitigation(threat2.id!, control2.id!, "erik2");
      const res2 = await dal.mitigationService.create(mitigation2);
      expect(res2).toBeTruthy();

      // Suggestions
      const threatSuggestion = genSuggestedThreat(component2Id);
      await dal.suggestionService.bulkInsert(model.id!, {
        threats: [threatSuggestion],
        controls: [
          genSuggestedControl({
            componentId: component2Id,
            mitigates: [{ partialThreatId: threatSuggestion.id.partialId }],
          }),
        ],
      });
      const threatSuggestionsOriginal =
        await dal.suggestionService.listThreatSuggestions(model.id!);
      const controlSuggestionsOriginal =
        await dal.suggestionService.listControlSuggestions(model.id!);

      await dal.suggestionService.acceptSuggestion(
        model.id!,
        threatSuggestionsOriginal[0].id,
        sampleUser.sub
      );
      await dal.suggestionService.acceptSuggestion(
        model.id!,
        controlSuggestionsOriginal[0].id,
        sampleUser.sub
      );

      // Delete the threat
      await dal.threatService.deleteByComponentId(model.id!, [
        threat1.componentId,
      ]);

      const modelCopy = new Model(systemId, "nr2", "erik");
      const modelCopyId = await data.copy(model.id!, modelCopy);
      expect(modelCopyId).toBeTruthy();
    });

    it("should return null on no matching srcModel", async () => {
      const modelCopy = new Model(randomUUID(), "nr2", "erik");
      const modelCopyId = await data.copy(randomUUID(), modelCopy);
      expect(modelCopyId).toBeFalsy();
    });
  });
});
