import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { createSampleModel } from "../../../../test-util/model.js";
import { sampleUserToken } from "../../../../test-util/sampleTokens.js";
import { sampleReviewer } from "../../../../test-util/sampleUser.js";

describe("reviews.list", () => {
  let app: Express.Application;
  let dal: DataAccessLayer;
  let modelId: string;
  let token = "";

  beforeAll(async () => {
    token = await sampleUserToken();
    ({ app, dal } = await createTestApp());
  });

  beforeEach(async () => {
    modelId = await createSampleModel(dal);
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get(`/api/v1/reviews/reviewers`);
    expect(res.status).toBe(401);
  });

  it("should return 200 with no query parameter", async () => {
    const res = await request(app)
      .get(`/api/v1/reviews/reviewers`)
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.reviewers[0].sub).toEqual(sampleReviewer.sub);
  });

  it("should return 200 with modelId query parameter", async () => {
    const res = await request(app)
      .get(`/api/v1/reviews/reviewers?modelId=${modelId}`)
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.reviewers[0].sub).toEqual(sampleReviewer.sub);
  });
});
