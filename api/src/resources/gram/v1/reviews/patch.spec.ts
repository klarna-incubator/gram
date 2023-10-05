import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Review, ReviewStatus } from "@gram/core/dist/data/reviews/Review.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { createSampleModel } from "../../../../test-util/model.js";
import {
  sampleOtherUserToken,
  sampleReviewerToken,
} from "../../../../test-util/sampleTokens.js";

describe("Reviews.update", () => {
  let app: any;
  let pool: any;
  let modelId: string;
  let review: Review;
  let dal: DataAccessLayer;
  let token = "";

  beforeAll(async () => {
    token = await sampleReviewerToken();
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
    const res = await request(app)
      .patch(`/api/v1/reviews/${modelId}`)
      .send({ note: "A new note" });
    expect(res.status).toBe(401);
  });

  it("should return 400 on invalid fields", async () => {
    const res = await request(app)
      .patch(`/api/v1/reviews/${modelId}`)
      .set("Authorization", token)
      .send({ status: "approved" });

    expect(res.status).toBe(400);
  });

  it("should return 403 on authorized request (called by role.user)", async () => {
    const otherUserToken = await sampleOtherUserToken();

    const res = await request(app)
      .patch(`/api/v1/reviews/${modelId}`)
      .set("Authorization", otherUserToken)
      .send({ note: "new note", reviewedBy: "new reviewer" });

    expect(res.status).toBe(403);
  });

  it("should return on updating note + reviewer (called by role.reviewer)", async () => {
    const res = await request(app)
      .patch(`/api/v1/reviews/${modelId}`)
      .set("Authorization", token)
      .send({ note: "new note", reviewedBy: "new reviewer" });

    expect(res.status).toBe(200);
    expect(res.body.review.modelId).toEqual(modelId);
    expect(res.body.review.note).toEqual("new note");
  });

  it("should return 200 on updating note", async () => {
    const res = await request(app)
      .patch(`/api/v1/reviews/${modelId}`)
      .set("Authorization", token)
      .send({ note: "A new note" });

    expect(res.status).toBe(200);
    expect(res.body.review.modelId).toEqual(modelId);
    expect(res.body.review.note).toEqual("A new note");
  });

  it("should return 200 on updating reviewer (called by role.reviewer)", async () => {
    const res = await request(app)
      .patch(`/api/v1/reviews/${modelId}`)
      .set("Authorization", token)
      .send({ reviewedBy: "new reviewer" });

    expect(res.status).toBe(200);
    expect(res.body.review.modelId).toEqual(modelId);
    expect(res.body.review.reviewedBy).toEqual("new reviewer");
  });

  afterAll(async () => {
    await _deleteAllTheThings(pool);
  });
});
