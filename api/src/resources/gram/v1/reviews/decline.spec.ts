import * as jwt from "@gram/core/dist/auth/jwt.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Review, ReviewStatus } from "@gram/core/dist/data/reviews/Review.js";
import { systemProvider } from "@gram/core/dist/data/systems/systems.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { createSampleModel } from "../../../../test-util/model.js";
import {
  sampleOtherUserToken,
  sampleReviewerToken,
} from "../../../../test-util/sampleTokens.js";
import { sampleOtherUser } from "../../../../test-util/sampleUser.js";
import { jest } from "@jest/globals";

describe("Reviews.decline", () => {
  const systemGetById = jest.spyOn(systemProvider, "getSystem");

  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  let modelId: string;
  let review: Review;
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
    const res = await request(app).post(`/api/v1/reviews/${modelId}/decline`);
    expect(res.status).toBe(401);
  });

  it("should return 403 on unauthorized requests (by role.user)", async () => {
    const otherUserToken = await sampleOtherUserToken();

    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/decline`)
      .set("Authorization", otherUserToken);

    expect(res.status).toBe(403);
  });

  it("should return 200 on succesful decline [without note] (by role.reviewer)", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/decline`)
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();
  });

  it("should return 200 on succesful decline [with note] (by role.reviewer)", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/decline`)
      .set("Authorization", token)
      .send({ note: "I have to decline this review request" });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();

    const rev = await dal.reviewService.getByModelId(modelId);
    expect(rev?.status).toEqual(ReviewStatus.Requested);
    expect(rev?.note).toEqual("I have to decline this review request");
  });

  afterAll(async () => {
    systemGetById.mockRestore();

    await _deleteAllTheThings(pool);
  });
});
