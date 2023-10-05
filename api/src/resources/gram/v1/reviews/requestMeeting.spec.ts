import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { createPostgresPool } from "@gram/core/dist/data/postgres.js";
import { Review, ReviewStatus } from "@gram/core/dist/data/reviews/Review.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { createSampleModel } from "../../../../test-util/model.js";
import {
  sampleReviewerToken,
  sampleUserToken,
} from "../../../../test-util/sampleTokens.js";

describe("Reviews.requestMeeting", () => {
  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  let modelId: string;
  let review: Review;
  let token = "";

  beforeAll(async () => {
    token = await sampleReviewerToken();
    pool = await createPostgresPool();
    ({ app, dal, pool } = await createTestApp());
  });

  beforeEach(async () => {
    /** Set up test model needed for review **/
    modelId = await createSampleModel(dal);

    review = new Review(
      modelId,
      "some-user",
      ReviewStatus.Requested,
      "some-reviewer"
    );
    await dal.reviewService.create(review);
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).post(
      `/api/v1/reviews/${modelId}/request-meeting`
    );
    expect(res.status).toBe(401);
  });

  it("should return 403 on un-authorized request (by role.user)", async () => {
    const userToken = await sampleUserToken();

    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/request-meeting`)
      .set("Authorization", userToken);

    expect(res.status).toBe(403);
  });

  it("should return 200 on succesful decline (by role.reviewer)", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/request-meeting`)
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();
  });

  afterAll(async () => {
    await _deleteAllTheThings(pool);
  });
});
