import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { systemProvider } from "@gram/core/dist/data/systems/systems.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import { randomUUID } from "crypto";
import pg from "pg";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { createSampleModel } from "../../../../test-util/model.js";
import {
  sampleAdminToken,
  sampleOtherUserToken,
  sampleUserToken,
} from "../../../../test-util/sampleTokens.js";
import { sampleAdmin } from "../../../../test-util/sampleUser.js";
import { jest } from "@jest/globals";

describe("reviews.create", () => {
  let app: any;
  let pool: pg.Pool;
  let modelId: any;
  let dal: DataAccessLayer;
  let token = "";

  const systemGetById = jest.spyOn(systemProvider, "getSystem");

  beforeAll(async () => {
    token = await sampleUserToken();
    ({ app, dal, pool } = await createTestApp());
  });

  beforeEach(async () => {
    /** Set up test model needed for review **/
    modelId = await createSampleModel(dal);
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${randomUUID()}`)
      .send({ reviewedBy: "some-user" });
    expect(res.status).toBe(401);
  });

  it("should return 403 on un-authorized request (different team)", async () => {
    const otherUserToken = await sampleOtherUserToken();

    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}`)
      .set("Authorization", otherUserToken)
      .send({ reviewedBy: "some-user" });
    expect(res.status).toBe(403);
  });

  it("should return 200 and review object on user request", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}`)
      .set("Authorization", token)
      .send({
        reviewedBy: "another user",
      });
    expect(res.status).toBe(200);
    expect(res.body.review.requestedBy).toEqual("test@abc.xyz");
    expect(res.body.review.reviewedBy).toEqual("another user");
  });

  it("should return 200 and review object on admin request", async () => {
    const adminToken = await sampleAdminToken();

    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}`)
      .set("Authorization", adminToken)
      .send({
        reviewedBy: "another user",
      });
    expect(res.status).toBe(200);
    expect(res.body.review.requestedBy).toEqual(sampleAdmin.sub);
    expect(res.body.review.reviewedBy).toEqual("another user");
  });

  afterAll(async () => {
    systemGetById.mockRestore();
    await _deleteAllTheThings(pool);
  });
});
