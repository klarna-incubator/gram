import request from "supertest";
import * as jwt from "../../../../auth/jwt";
import { DataAccessLayer } from "../../../../data/dal";
import { Review, ReviewStatus } from "../../../../data/reviews/Review";
import { systemProvider } from "../../../../data/systems/systems";
import { _deleteAllTheThings } from "../../../../data/utils";
import { createTestApp } from "../../../../test-util/app";
import { createSampleModel } from "../../../../test-util/model";
import { sampleOtherUser, sampleUser } from "../../../../test-util/sampleUser";

describe("Reviews.cancel", () => {
  const validate = jest.spyOn(jwt, "validateToken");
  const systemGetById = jest.spyOn(systemProvider, "getSystem");

  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  let modelId: string;
  let review: Review;

  beforeAll(async () => {
    ({ app, pool, dal } = await createTestApp());
  });

  beforeEach(async () => {
    validate.mockImplementation(async () => {
      return sampleUser;
    });

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
    validate.mockImplementation(async () => {
      return sampleOtherUser;
    });

    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/cancel`)
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(403);
  });

  it("should return 200 on successful cancel (by owner)", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/cancel`)
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();

    const review = await dal.reviewService.getByModelId(modelId);
    expect(review?.status).toBe(ReviewStatus.Canceled);
  });

  afterAll(async () => {
    validate.mockRestore();
    systemGetById.mockRestore();

    await _deleteAllTheThings(pool);
  });
});
