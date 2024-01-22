import { randomUUID } from "crypto";
import { DataAccessLayer } from "../dal.js";
import { createPostgresPool } from "../postgres.js";
import { _deleteAllTheThings } from "../utils.js";
import { LinkDataService } from "./LinkDataService.js";
import { LinkObjectType } from "./Link.js";

describe("LinkDataService implementation", () => {
  let data: LinkDataService;
  let dal: DataAccessLayer;

  beforeAll(async () => {
    const pool = await createPostgresPool();
    dal = new DataAccessLayer(pool);
    data = dal.linkService;
  });

  beforeEach(async () => {
    await _deleteAllTheThings(dal);
  });

  afterAll(async () => {
    await dal.pool.end();
  });

  describe("insert link", () => {
    it("should insert link", async () => {
      const modelId = randomUUID();
      await data.insertLink(
        LinkObjectType.Model,
        modelId,
        "label",
        "url",
        "icon",
        "createdBy"
      );
      const res = await data.listLinks(LinkObjectType.Model, modelId);
      expect(res.length).toEqual(1);

      expect(res[0].label).toEqual("label");
      expect(res[0].url).toEqual("url");
      expect(res[0].createdBy).toEqual("createdBy");
      expect(res[0].objectType).toEqual(LinkObjectType.Model);
      expect(res[0].objectId).toEqual(modelId);
    });
  });

  describe("list links", () => {
    it("should return links when multiple", async () => {
      const modelId = randomUUID();
      await data.insertLink(
        LinkObjectType.Model,
        modelId,
        "label",
        "url",
        "icon",
        "createdBy"
      );
      await data.insertLink(
        LinkObjectType.Model,
        randomUUID(),
        "label2",
        "url2",
        "icon",
        "createdBy"
      );
      await data.insertLink(
        LinkObjectType.Model,
        modelId,
        "label3",
        "url3",
        "icon",
        "createdBy"
      );
      const res = await data.listLinks(LinkObjectType.Model, modelId);
      expect(res.length).toEqual(2);
    });
    it("should return empty list when no links", async () => {
      const modelId = randomUUID();
      let res = await data.listLinks(LinkObjectType.Model, modelId);
      expect(res.length).toEqual(0);

      // Insert on different id
      await data.insertLink(
        LinkObjectType.Model,
        randomUUID(),
        "label",
        "url",
        "icon",
        "createdBy"
      );
      res = await data.listLinks(LinkObjectType.Model, modelId);
      expect(res.length).toEqual(0);
    });
  });

  describe("delete link", () => {
    it("should delete link", async () => {
      const modelId = randomUUID();
      await data.insertLink(
        LinkObjectType.Model,
        modelId,
        "label",
        "url",
        "icon",
        "createdBy"
      );
      let res = await data.listLinks(LinkObjectType.Model, modelId);
      expect(res.length).toEqual(1);

      await data.deleteLink(res[0].id);
      res = await data.listLinks(LinkObjectType.Model, modelId);
      expect(res.length).toEqual(0);
    });

    it("should not delete link when id does not exist", async () => {
      const modelId = randomUUID();
      await data.insertLink(
        LinkObjectType.Model,
        modelId,
        "label",
        "url",
        "icon",
        "createdBy"
      );
      let res = await data.listLinks(LinkObjectType.Model, modelId);
      expect(res.length).toEqual(1);

      await data.deleteLink(res[0].id + 1);
      res = await data.listLinks(LinkObjectType.Model, modelId);
      expect(res.length).toEqual(1);
    });
  });
});
