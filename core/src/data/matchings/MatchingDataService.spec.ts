import { randomUUID } from "crypto";
import Control from "../controls/Control.js";
import { DataAccessLayer } from "../dal.js";
import Model from "../models/Model.js";
import { createPostgresPool } from "../postgres.js";
import Threat from "../threats/Threat.js";
import { _deleteAllTheThings } from "../utils.js";
import Matching from "./Matching.js";
import { MatchingDataService } from "./MatchingDataService.js";
import { clear } from "console";

describe("MatchingDataService implementation", () => {
  let data: MatchingDataService;
  let dal: DataAccessLayer;
  let pool: any;

  let model: Model;

  beforeAll(async () => {
    pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    data = new MatchingDataService(dal);
  });

  beforeEach(async () => {
    await _deleteAllTheThings(dal);
    model = new Model("some-system-id", "some-version", "root");
    model.data = {
      components: [
        {
          id: randomUUID(),
          name: "some-component-name",
          type: "ds",
          x: 0,
          y: 0,
        },
      ],
      dataFlows: [],
    };
    model.id = await dal.modelService.create(model);
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  describe("create", () => {
    it("should create a new matching for an existing model", async () => {
      const resourceId = randomUUID();
      const componentId = model.data.components[0].id;
      const matching = new Matching(
        model.id!,
        resourceId,
        componentId,
        "test@klarna.com"
      );

      await data.create(matching);

      const result = await pool.query(
        "SELECT * FROM resource_matchings WHERE model_id = $1 AND resource_id = $2",
        [model.id, resourceId]
      );

      expect(result.rows.length).toEqual(1);
      expect(result.rows[0].component_id).toEqual(componentId);
      expect(result.rows[0].model_id).toEqual(model.id);
      expect(result.rows[0].resource_id).toEqual(resourceId);
    });

    it("should throw an error if the model does not exist", async () => {
      const resourceId = randomUUID();
      const componentId = model.data.components[0].id;
      const matching = new Matching(
        randomUUID(),
        resourceId,
        componentId,
        "test@klarna.com"
      );

      await expect(data.create(matching)).rejects.toThrowError();
    });

    it("should update an existing matching for an existing model", async () => {
      const resourceId = randomUUID();
      const componentId1 = model.data.components[0].id;
      const componentId2 = randomUUID();
      const modelId = model.id!;
      const matching1 = new Matching(
        modelId,
        resourceId,
        componentId1,
        "test1@klarna.com"
      );

      await data.create(matching1);

      const result1 = await pool.query(
        "SELECT * FROM resource_matchings WHERE model_id = $1 AND resource_id = $2",
        [model.id, resourceId]
      );

      expect(result1.rows.length).toEqual(1);
      expect(result1.rows[0].resource_id).toEqual(resourceId);
      expect(result1.rows[0].model_id).toEqual(model.id);
      expect(result1.rows[0].component_id).toEqual(componentId1);

      const matching2 = new Matching(
        modelId,
        resourceId,
        componentId2,
        "test2@klarna.com"
      );

      await data.create(matching2);

      const result2 = await pool.query(
        "SELECT * FROM resource_matchings WHERE model_id = $1 AND resource_id = $2",
        [model.id, resourceId]
      );

      expect(result2.rows.length).toEqual(1);
      expect(result2.rows[0].resource_id).toEqual(resourceId);
      expect(result2.rows[0].model_id).toEqual(model.id);
      expect(result2.rows[0].component_id).toEqual(componentId2);
    });
  });
});
