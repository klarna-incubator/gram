import { Application } from "express";
import request from "supertest";
import * as jwt from "@gram/core/dist/auth/jwt";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { createTestApp } from "../../../../test-util/app";
import { createSampleModel } from "../../../../test-util/model";
import { sampleReviewer, sampleUser } from "../../../../test-util/sampleUser";

describe("reviews.list", () => {
  const validate = jest.spyOn(jwt, "validateToken");

  let app: Application;
  let dal: DataAccessLayer;
  let modelId: string;

  beforeAll(async () => {
    ({ app, dal } = await createTestApp());
  });

  beforeEach(async () => {
    validate.mockImplementation(async () => sampleUser);
    modelId = await createSampleModel(dal);
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get(`/api/v1/reviews/reviewers`);
    expect(res.status).toBe(401);
  });

  it("should return 200 with no query parameter", async () => {
    const res = await request(app)
      .get(`/api/v1/reviews/reviewers`)
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(200);
    expect(res.body.reviewers[0].sub).toEqual(sampleReviewer.sub);
  });

  it("should return 200 with modelId query parameter", async () => {
    const res = await request(app)
      .get(`/api/v1/reviews/reviewers?modelId=${modelId}`)
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(200);
    expect(res.body.reviewers[0].sub).toEqual(sampleReviewer.sub);
  });

  afterAll(() => {
    validate.mockRestore();
  });
});
