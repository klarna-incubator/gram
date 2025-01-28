import { randomUUID } from "crypto";
import { DataAccessLayer } from "../dal.js";
import Model from "../models/Model.js";
import { createPostgresPool } from "../postgres.js";
import { _deleteAllTheThings } from "../utils.js";
import ResourceMatching from "./ResourceMatching.js";
import { ResourceMatchingDataService } from "./ResourceMatchingDataService.js";

describe("MatchingDataService implementation", () => {
  let data: ResourceMatchingDataService;
  let dal: DataAccessLayer;
  let pool: any;

  let model: Model;

  beforeAll(async () => {
    pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    data = new ResourceMatchingDataService(dal);
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
      const matching = new ResourceMatching(
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
      const matching = new ResourceMatching(
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
      const matching1 = new ResourceMatching(
        modelId,
        resourceId,
        componentId1,
        "test1@klarna.com"
      );

      await data.create(matching1);

      const result1 = await pool.query(
        "SELECT * FROM resource_matchings WHERE model_id = $1 AND resource_id = $2",
        [modelId, resourceId]
      );

      expect(result1.rows.length).toEqual(1);
      expect(result1.rows[0].resource_id).toEqual(resourceId);
      expect(result1.rows[0].model_id).toEqual(model.id);
      expect(result1.rows[0].component_id).toEqual(componentId1);

      const matching2 = new ResourceMatching(
        modelId,
        resourceId,
        componentId2,
        "test2@klarna.com"
      );

      await data.create(matching2);

      const result2 = await pool.query(
        "SELECT * FROM resource_matchings WHERE model_id = $1 AND resource_id = $2",
        [modelId, resourceId]
      );

      expect(result2.rows.length).toEqual(1);
      expect(result2.rows[0].resource_id).toEqual(resourceId);
      expect(result2.rows[0].model_id).toEqual(modelId);
      expect(result2.rows[0].component_id).toEqual(componentId2);
    });
  });

  describe("list", () => {
    it("should return a list of matchings for an existing model", async () => {
      // Create a model
      const model = new Model("some-system-id", "some-version", "root");
      const componentId1 = randomUUID();
      const componentId2 = randomUUID();
      model.data = {
        components: [
          {
            id: componentId1,
            name: "some-component-name",
            type: "ds",
            x: 0,
            y: 0,
          },
          {
            id: componentId2,
            name: "another-component-name",
            type: "ds",
            x: 0,
            y: 0,
          },
        ],
        dataFlows: [],
      };
      model.id = await dal.modelService.create(model);

      // Create matchings

      await data.create(
        new ResourceMatching(
          model.id!,
          randomUUID(),
          componentId1,
          "correct_matching@klarna.com"
        )
      );
      await data.create(
        new ResourceMatching(
          model.id!,
          randomUUID(),
          componentId2,
          "correct_matching@klarna.com"
        )
      );
      await data.create(
        new ResourceMatching(
          model.id!,
          randomUUID(),
          randomUUID(),
          "incorrect_matching@klarna.com"
        )
      );

      const result = await data.list(model.id!);

      expect(result.length).toEqual(2);
    });
    it("should return an empty list of matchings for a non-existing model", async () => {
      const result = await data.list(randomUUID());
      expect(result.length).toEqual(0);
    });
  });

  describe("delete", () => {
    it("should delete a matching", async () => {
      const resourceId = randomUUID();
      const componentId = model.data.components[0].id;
      const matching = new ResourceMatching(
        model.id!,
        resourceId,
        componentId,
        "test@klarna.com"
      );
      await data.create(matching);
      await data.delete(
        model.id!,
        resourceId,
        componentId,
        "delete@klarna.com"
      );

      const result = await pool.query(
        "SELECT * FROM resource_matchings WHERE model_id = $1 AND resource_id = $2",
        [model.id, resourceId]
      );

      expect(result.rows.length).toEqual(1);
      expect(result.rows[0].deleted_at).not.toBeNull();
      expect(result.rows[0].updated_by).toEqual("delete@klarna.com");
    });

    it("should not delete a matching if model id is incorrect", async () => {
      const resourceId = randomUUID();
      const componentId = model.data.components[0].id;
      const matching = new ResourceMatching(
        model.id!,
        resourceId,
        componentId,
        "delete@klarna.com"
      );
      await data.create(matching);

      await data.delete(
        randomUUID(),
        resourceId,
        componentId,
        "do_not_delete@klarna.com"
      );

      const result = await pool.query(
        "SELECT * FROM resource_matchings WHERE resource_id = $1 AND component_id = $2",
        [resourceId, componentId]
      );

      expect(result.rows.length).toEqual(1);
      expect(result.rows[0].deleted_at).toBeNull();
      expect(result.rows[0].updated_by).not.toEqual("do_not_delete@klarna.com");
    });
  });
});
