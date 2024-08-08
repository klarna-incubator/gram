import { randomUUID } from "crypto";
import { DataAccessLayer } from "../dal.js";
import { createPostgresPool } from "../postgres.js";
import { _deleteAllTheThings } from "../utils.js";
import { FlowDataService } from "./FlowDataService.js";
import { createSampleModel } from "../../test-util/model.js";

describe("FlowDataService implementation", () => {
  let ds: FlowDataService;
  let dal: DataAccessLayer;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    ds = dal.flowService;
  });

  beforeEach(async () => {
    await _deleteAllTheThings(dal);
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  describe("insert flow", () => {
    it("should insert flow", async () => {
      const modelId = randomUUID();
      const dataFlowId = randomUUID();
      const originComponentId = randomUUID();
      const summary = "GET /hello-world";
      const attributes = {
        secure: "totally",
      };
      await ds.insertFlow(
        modelId,
        dataFlowId,
        summary,
        originComponentId,
        attributes,
        "createdBy"
      );
      const res = await ds.listFlows(modelId, dataFlowId);
      expect(res.length).toEqual(1);

      expect(res[0].summary).toEqual(summary);
      expect(res[0].originComponentId).toEqual(originComponentId);
      expect(res[0].attributes.secure).toEqual(attributes.secure);
      expect(res[0].createdBy).toEqual("createdBy");
    });
  });

  describe("list flows", () => {
    it("should return flows when multiple", async () => {
      const modelId = randomUUID();
      const dataFlowId = randomUUID();
      const originComponentId = randomUUID();
      const summary = "GET /hello-world";
      const data = {
        secure: "totally",
      };
      await ds.insertFlow(
        modelId,
        dataFlowId,
        summary,
        originComponentId,
        data,
        "createdBy"
      );
      await ds.insertFlow(
        modelId,
        dataFlowId,
        summary,
        originComponentId,
        data,
        "createdBy"
      );
      await ds.insertFlow(
        modelId,
        dataFlowId,
        summary,
        originComponentId,
        data,
        "createdBy"
      );
      const res = await ds.listFlows(modelId, dataFlowId);
      expect(res.length).toEqual(3);
    });

    it("should return empty list when no flows", async () => {
      const modelId = randomUUID();
      const dataFlowId = randomUUID();
      const originComponentId = randomUUID();
      const summary = "GET /hello-world";
      let res = await ds.listFlows(modelId, dataFlowId);
      expect(res.length).toEqual(0);

      // Insert on different id
      const attributes = {
        secure: "totally",
      };
      await ds.insertFlow(
        modelId,
        randomUUID(),
        summary,
        originComponentId,
        attributes,
        "createdBy"
      );
      res = await ds.listFlows(modelId, dataFlowId);
      expect(res.length).toEqual(0);
    });
  });

  describe("delete link", () => {
    it("should delete flows", async () => {
      const modelId = randomUUID();
      const dataFlowId = randomUUID();
      const originComponentId = randomUUID();
      const summary = "GET /hello-world";
      await ds.insertFlow(
        modelId,
        dataFlowId,
        summary,
        originComponentId,
        {
          secure: "totally",
        },
        "createdBy"
      );
      let res = await ds.listFlows(modelId, dataFlowId);
      expect(res.length).toEqual(1);

      await ds.deleteFlow(res[0].id);
      res = await ds.listFlows(modelId, dataFlowId);
      expect(res.length).toEqual(0);
    });

    it("should not delete link when id does not exist", async () => {
      const modelId = randomUUID();
      const dataFlowId = randomUUID();
      const originComponentId = randomUUID();
      const summary = "GET /hello-world";
      await ds.insertFlow(
        modelId,
        dataFlowId,
        summary,
        originComponentId,
        {
          secure: "totally",
        },
        "createdBy"
      );
      let res = await ds.listFlows(modelId, dataFlowId);
      expect(res.length).toEqual(1);

      await ds.deleteFlow(res[0].id + 1);
      res = await ds.listFlows(modelId, dataFlowId);
      expect(res.length).toEqual(1);
    });
  });

  describe("copy flows from one model to another", () => {
    it("should copy flows", async () => {
      const modelId = await createSampleModel(dal);
      const dataFlowId = randomUUID();
      const originComponentId = randomUUID();
      const summary = "GET /hello-world";
      await ds.insertFlow(
        modelId,
        dataFlowId,
        summary,
        originComponentId,
        {
          secure: "totally",
        },
        "createdBy"
      );
      let res = await ds.listFlows(modelId, dataFlowId);
      expect(res.length).toEqual(1);

      const newDataFlowId = randomUUID();
      const newModelId = randomUUID();
      const uuid = new Map<string, string>();
      uuid.set(dataFlowId, newDataFlowId);
      await ds.copyFlowsBetweenModels(modelId, newModelId, uuid);
      res = await ds.listFlows(newModelId, newDataFlowId);
      expect(res.length).toEqual(1);
    });

    it("should not copy flows when no flows", async () => {
      const modelId = await createSampleModel(dal);
      const dataFlowId = randomUUID();
      let res = await ds.listFlows(modelId, dataFlowId);
      expect(res.length).toEqual(0);

      const newModelId = randomUUID();
      await ds.copyFlowsBetweenModels(
        modelId,
        newModelId,
        new Map<string, string>()
      );
      res = await ds.listFlows(newModelId, dataFlowId);
      expect(res.length).toEqual(0);
    });
  });
});
