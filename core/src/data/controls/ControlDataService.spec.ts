import { randomUUID } from "crypto";
import pg from "pg";
import { DataAccessLayer } from "../dal.js";
import Mitigation from "../mitigations/Mitigation.js";
import Model from "../models/Model.js";
import { createPostgresPool } from "../postgres.js";
import Threat from "../threats/Threat.js";
import { _deleteAllTheThings } from "../utils.js";
import Control from "./Control.js";
import { ControlDataService } from "./ControlDataService.js";

describe("ControlDataService implementation", () => {
  let data: ControlDataService;
  let dal: DataAccessLayer;
  let model: Model;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    data = new ControlDataService(dal);
  });

  beforeEach(async () => {
    await _deleteAllTheThings(dal);
    model = new Model("some-system-id", "some-version", "root");
    model.data = { components: [], dataFlows: [] };
    model.id = await dal.modelService.create(model);
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  describe("getById control", () => {
    it("should return a valid control", async () => {
      const componentId = randomUUID();
      const control = new Control(
        "title",
        "description",
        true,
        model.id!,
        componentId,
        "createdBy"
      );
      control.id = await data.create(control);

      const fetched = await data.getById(control.id!);
      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(fetched?.toJSON()).toBeDefined();
      expect(fetched?.id).toBe(control.id);
      expect(fetched?.modelId).toBe(model.id);
      expect(fetched?.componentId).toBe(componentId);
      expect(fetched?.title).toBe("title");
      expect(fetched?.inPlace).toBe(true);
      expect(fetched?.createdBy).toBe("createdBy");
      expect(fetched?.suggestionId).toBe(undefined);
      expect(fetched?.description).toBe("description");
      expect(fetched?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(fetched?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt).toBeGreaterThan(yesterday.getTime());
    });

    it("should return null value by default", async () => {
      const control = await data.getById(randomUUID());
      expect(control).toBe(null);
    });
  });

  describe("list controls", () => {
    it("should return controls of model", async () => {
      const componentId = randomUUID();
      const control1 = new Control(
        "title1",
        "description1",
        true,
        model.id!,
        componentId,
        "createdBy1"
      );
      control1.id = await data.create(control1);

      const control2 = new Control(
        "title2",
        "description2",
        false,
        model.id!,
        componentId,
        "createdBy2"
      );
      control2.id = await data.create(control2);

      const controls = await data.list(model.id!);

      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(controls.length).toEqual(2);
      expect(controls[0].toJSON()).toBeDefined();
      expect(controls[0].id).toBe(control2.id);
      expect(controls[0].modelId).toBe(model.id!);
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
      expect(controls[1].modelId).toBe(model.id!);
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
    });

    it("should return empty list by default", async () => {
      const controls = await data.list(randomUUID());
      expect(controls).toEqual([]);
    });
  });

  describe("delete control", () => {
    it("should return false on deleting non-existent control", async () => {
      const res = await data.delete(model.id!, randomUUID());
      expect(res).toBeFalsy();
    });
    it("should not delete other rows", async () => {
      const componentId = randomUUID();
      const control = new Control(
        "title",
        "description",
        true,
        model.id!,
        componentId,
        "createdBy"
      );
      control.id = await data.create(control);
      const res = await data.delete(model.id!, randomUUID());
      expect(res).toBeFalsy();
      const fetched = await data.getById(control.id!);
      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(fetched).toBeTruthy();
      expect(fetched?.toJSON()).toBeDefined();
      expect(fetched?.id).toBe(control.id);
      expect(fetched?.modelId).toBe(model.id!);
      expect(fetched?.componentId).toBe(componentId);
      expect(fetched?.title).toBe("title");
      expect(fetched?.inPlace).toBe(true);
      expect(fetched?.createdBy).toBe("createdBy");
      expect(fetched?.suggestionId).toBe(undefined);
      expect(fetched?.description).toBe("description");
      expect(fetched?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(fetched?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt).toBeGreaterThan(yesterday.getTime());
    });
    it("should not be able to fetch deleted row", async () => {
      const componentId = randomUUID();
      const control = new Control(
        "title",
        "description",
        true,
        model.id!,
        componentId,
        "createdBy"
      );
      control.id = await data.create(control);
      const res = await data.delete(model.id!, control.id!);
      expect(res).toBeTruthy();
      const fetched = await data.getById(control.id!);
      expect(fetched).toBeFalsy();
    });
    it("should delete associated mitigations", async () => {
      const componentId = randomUUID();
      const control = new Control(
        "title",
        "description",
        true,
        model.id!,
        componentId,
        "createdBy"
      );
      control.id = await data.create(control);

      const control2 = new Control(
        "title2",
        "description2",
        false,
        model.id!,
        componentId,
        "createdBy2"
      );
      control2.id = await data.create(control2);

      const threat = new Threat(
        "title2threat",
        "description2threat",
        model.id!,
        componentId,
        "createdBy2threat"
      );
      threat.id = await dal.threatService.create(threat);

      const mitigation = new Mitigation(
        threat.id!,
        control.id!,
        "createdBy2threat1"
      );
      const res1 = await dal.mitigationService.create(mitigation);
      expect(res1).toBeTruthy();
      const { threatId, controlId } = res1
        ? res1
        : { threatId: "", controlId: "" };

      const mitigation2 = new Mitigation(
        threat.id!,
        control2.id!,
        "createdBy2threat3"
      );
      const res2: any = await dal.mitigationService.create(mitigation2);
      expect(res2).toBeTruthy();
      const control2Id = res2.controlId;

      const mitigationRes = await dal.mitigationService.getById(
        threatId,
        controlId
      );
      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(mitigationRes!.toJSON()).toBeDefined();
      expect(mitigationRes!.threatId).toBe(threatId);
      expect(mitigationRes!.controlId).toBe(controlId);
      expect(mitigationRes!.createdBy).toBe("createdBy2threat1");
      expect(mitigationRes!.createdAt).toBeLessThan(Date.now() + 1000);
      expect(mitigationRes!.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(mitigationRes!.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(mitigationRes!.updatedAt).toBeGreaterThan(yesterday.getTime());

      const res = await data.delete(model.id!, controlId);
      expect(res).toBeTruthy();

      const fetchDeleted = await dal.mitigationService.getById(
        threatId,
        controlId
      );
      expect(fetchDeleted).toBe(null);

      let fetched = await dal.mitigationService.getById(threatId, control2Id);
      expect(fetched?.toJSON()).toBeDefined();
      expect(fetched?.threatId).toBe(threatId);
      expect(fetched?.controlId).toBe(control2Id);
      expect(fetched?.createdBy).toBe("createdBy2threat3");
      expect(fetched?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(fetched?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt).toBeGreaterThan(yesterday.getTime());
    });
  });

  describe("update control", () => {
    it("should return false on deleting non-existent control", async () => {
      const componentId = randomUUID();
      const control = new Control(
        "title",
        "description",
        true,
        model.id!,
        componentId,
        "createdBy"
      );
      control.id = await data.create(control);

      const fetched = await data.getById(control.id!);
      const today = new Date(Date.now());
      const yesterday = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        today.getHours()
      );
      expect(fetched?.toJSON()).toBeDefined();
      expect(fetched?.id).toBe(control.id);
      expect(fetched?.modelId).toBe(model.id!);
      expect(fetched?.componentId).toBe(componentId);
      expect(fetched?.title).toBe("title");
      expect(fetched?.inPlace).toBe(true);
      expect(fetched?.createdBy).toBe("createdBy");
      expect(fetched?.suggestionId).toBe(undefined);
      expect(fetched?.description).toBe("description");
      expect(fetched?.createdAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.createdAt).toBeGreaterThan(yesterday.getTime());
      expect(fetched?.updatedAt).toBeLessThan(Date.now() + 1000);
      expect(fetched?.updatedAt).toBeGreaterThan(yesterday.getTime());

      const updated = await data.update(model.id!, control.id!, {
        inPlace: false,
        title: "newtitle",
        description: "baddesc",
      });
      expect(updated).toBeInstanceOf(Control);
      if (updated instanceof Control) {
        expect(updated!.toJSON()).toBeDefined();
        expect(updated!.id).toBe(control.id);
        expect(updated!.modelId).toBe(model.id!);
        expect(updated!.componentId).toBe(componentId);
        expect(updated!.title).toBe("newtitle");
        expect(updated!.inPlace).toBe(false);
        expect(updated!.createdBy).toBe("createdBy");
        expect(updated!.suggestionId).toBe(undefined);
        expect(updated!.description).toBe("baddesc");
      }
    });
  });
});
