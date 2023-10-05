import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Review, ReviewStatus } from "@gram/core/dist/data/reviews/Review.js";
import { randomUUID } from "crypto";
import { Express } from "express";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { createSampleModel as genSampleModel } from "../../../../test-util/model.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";
import { sampleUser } from "../../../../test-util/sampleUser.js";
import { jest } from "@jest/globals";

describe("reviews.get", () => {
  let app: Express;
  let pool: any;
  let getByModelId: any;
  let modelId: string;
  let dal: DataAccessLayer;
  let token = "";

  afterAll(async () => await pool.end());

  beforeAll(async () => {
    token = await sampleUserToken();
    ({ app, dal, pool } = await createTestApp());

    getByModelId = jest.spyOn(dal.reviewService, "getByModelId");
  });

  beforeEach(async () => {
    modelId = await genSampleModel(dal);

    const review = new Review(modelId, sampleUser.sub, ReviewStatus.Requested);
    await dal.reviewService.create(review);
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get("/api/v1/reviews/123");
    expect(res.status).toBe(401);
  });

  it("should return 400 on invalid review id (not uuid)", async () => {
    const res = await request(app)
      .get("/api/v1/reviews/234")
      .set("Authorization", token);

    expect(res.status).toBe(400);
  });

  it("should return 200 on request", async () => {
    const res = await request(app)
      .get(`/api/v1/reviews/${modelId}`)
      .set("Authorization", token);
    expect(res.status).toBe(200);

    expect(res.body.review.status).toEqual(ReviewStatus.Requested);
    expect(res.body.review.note).toEqual("");
    expect(res.body.review.model_id).toEqual(modelId);
    expect(res.body.review.created_at).toBeDefined();
    expect(res.body.review.updated_at).toBeDefined();
    expect(res.body.review.requester).toBeDefined();
    expect(res.body.review.requester.sub).toEqual(sampleUser.sub);
  });

  it("should return 404 on invalid review model-id (valid uuid)", async () => {
    const res = await request(app)
      .get(`/api/v1/reviews/${randomUUID()}`)
      .set("Authorization", token);

    expect(res.status).toBe(404);
  });

  it("should return 500 on unknown error from get()", async () => {
    getByModelId.mockImplementation(() => {
      throw new Error("Unknown");
    });

    const res = await request(app)
      .get(`/api/v1/reviews/${modelId}`)
      .set("Authorization", token);

    expect(res.status).toBe(500);
  });

  afterAll(() => {
    getByModelId.mockRestore();
  });
});
