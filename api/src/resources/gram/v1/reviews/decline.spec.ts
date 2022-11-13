import request from "supertest";
import * as jwt from "../../../../auth/jwt";
import { DataAccessLayer } from "../../../../data/dal";
import { Review, ReviewStatus } from "../../../../data/reviews/Review";
import { systemProvider } from "../../../../data/systems/SystemProvider";
import { _deleteAllTheThings } from "../../../../data/utils";
import { createTestApp } from "../../../../test-util/app";
import { createSampleModel } from "../../../../test-util/model";
import { sampleReviewer } from "../../../../test-util/sampleUser";
import { sampleOtherUser } from "../../../../test-util/sampleUser";

describe("Reviews.decline", () => {
  const validate = jest.spyOn(jwt, "validateToken");
  const systemGetById = jest.spyOn(systemProvider, "getSystem");

  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  let modelId: string;
  let review: Review;

  beforeAll(async () => {
    ({ app, dal, pool } = await createTestApp());
  });

  beforeEach(async () => {
    validate.mockImplementation(async () => sampleReviewer);

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
    validate.mockImplementation(async () => sampleOtherUser);

    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/decline`)
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(403);
  });

  it("should return 200 on succesful decline [without note] (by role.reviewer)", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/decline`)
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();
  });

  it("should return 200 on succesful decline [with note] (by role.reviewer)", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/decline`)
      .set("Authorization", "bearer validToken")
      .send({ note: "I have to decline this review request" });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();

    const rev = await dal.reviewService.getByModelId(modelId);
    expect(rev?.status).toEqual(ReviewStatus.Declined);
    expect(rev?.note).toEqual("I have to decline this review request");
  });

  afterAll(async () => {
    validate.mockRestore();
    systemGetById.mockRestore();

    await _deleteAllTheThings(pool);
  });
});
