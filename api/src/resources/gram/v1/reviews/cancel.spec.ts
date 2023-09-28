import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Review, ReviewStatus } from "@gram/core/dist/data/reviews/Review.js";
import { systemProvider } from "@gram/core/dist/data/systems/systems.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import { jest } from "@jest/globals";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { createSampleModel } from "../../../../test-util/model.js";
import {
  sampleOtherUserToken,
  sampleUserToken,
} from "../../../../test-util/sampleTokens.js";

describe("Reviews.cancel", () => {
  const systemGetById = jest.spyOn(systemProvider, "getSystem");

  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  let modelId: string;
  let review: Review;
  let token = "";

  beforeAll(async () => {
    ({ app, pool, dal } = await createTestApp());
    token = await sampleUserToken();
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
    const res = await request(app).post(`/api/v1/reviews/${modelId}/cancel`);
    expect(res.status).toBe(401);
  });

  it("should return 403 on authorized request (by user on different team)", async () => {
    const otherUserToken = await sampleOtherUserToken();

    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/cancel`)
      .set("Authorization", otherUserToken);

    expect(res.status).toBe(403);
  });

  it("should return 200 on successful cancel (by owner)", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/cancel`)
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();

    const review = await dal.reviewService.getByModelId(modelId);
    expect(review?.status).toBe(ReviewStatus.Canceled);
  });

  afterAll(async () => {
    systemGetById.mockRestore();

    await _deleteAllTheThings(pool);
  });
});
