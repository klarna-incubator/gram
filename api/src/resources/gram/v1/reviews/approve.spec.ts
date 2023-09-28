import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { Review, ReviewStatus } from "@gram/core/dist/data/reviews/Review.js";
import { systemProvider } from "@gram/core/dist/data/systems/systems.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { createSampleModel } from "../../../../test-util/model.js";
import {
  sampleReviewerToken,
  sampleUserToken,
} from "../../../../test-util/sampleTokens.js";
import { jest } from "@jest/globals";

describe("Reviews.approve", () => {
  const systemGetById = jest.spyOn(systemProvider, "getSystem");

  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  let modelId: string;
  let review: Review;
  let token = "";

  beforeAll(async () => {
    token = await sampleReviewerToken();
    ({ app, pool, dal } = await createTestApp());
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
    const res = await request(app).post(`/api/v1/reviews/${modelId}/approve`);
    expect(res.status).toBe(401);
  });

  it("should return 403 on non-reviewer approval request (default user)", async () => {
    const userToken = await sampleUserToken();
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/approve`)
      .set("Authorization", userToken);

    expect(res.status).toBe(403);
  });

  it("should return 200 on succesful approve [without note] for role.reviewer", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/approve`)
      .set("Authorization", token);

    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();
  });

  it("should return 200 on succesful approve [with note] for role.reviewer", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/approve`)
      .set("Authorization", token)
      .send({ note: "Approved with note" });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();

    const rev = await dal.reviewService.getByModelId(modelId);
    expect(rev!.status).toEqual("approved");
    expect(rev!.note).toEqual("Approved with note");
  });

  afterAll(async () => {
    systemGetById.mockRestore();
    await _deleteAllTheThings(pool);
  });
});
