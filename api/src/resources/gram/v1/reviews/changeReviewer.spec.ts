import * as jwt from "@gram/core/dist/auth/jwt.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { createPostgresPool } from "@gram/core/dist/data/postgres.js";
import { Review, ReviewStatus } from "@gram/core/dist/data/reviews/Review.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { createSampleModel } from "../../../../test-util/model.js";
import { sampleReviewer } from "../../../../test-util/sampleReviewer.js";
import {
  sampleOtherUserToken,
  sampleReviewerToken,
} from "../../../../test-util/sampleTokens.js";
import {
  sampleOtherUser,
  sampleUser,
} from "../../../../test-util/sampleUser.js";

describe("Reviews.changeReviewer", () => {
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
      "some-other-reviewer"
    );
    await dal.reviewService.create(review);
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/change-reviewer`)
      .send({ newReviewer: sampleReviewer.sub });
    expect(res.status).toBe(401);
  });

  it("should return 403 on un-authorized request", async () => {
    const otherUserToken = await sampleOtherUserToken();

    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/change-reviewer`)
      .set("Authorization", otherUserToken)
      .send({ newReviewer: sampleReviewer.sub });

    expect(res.status).toBe(403);
  });

  it("should return 200 on successful change-reviewer", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/change-reviewer`)
      .set("Authorization", token)
      .send({ newReviewer: sampleReviewer.sub });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();
  });

  it("should return 400 on invalid data sent to change-reviewer", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/change-reviewer`)
      .set("Authorization", token)
      .send({ hello: "world" });

    expect(res.status).toBe(400);
  });

  it("should return 400 on non-user reviewer sent to change-reviewer", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/change-reviewer`)
      .set("Authorization", token)
      .send({ newReviewer: sampleUser.sub });

    expect(res.status).toBe(400);
  });

  afterAll(async () => {
    await _deleteAllTheThings(pool);
  });
});
