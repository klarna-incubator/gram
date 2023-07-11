import request from "supertest";
import * as jwt from "@gram/core/dist/auth/jwt";
import { Role } from "@gram/core/dist/auth/models/Role";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { createPostgresPool } from "@gram/core/dist/data/postgres";
import { Review, ReviewStatus } from "@gram/core/dist/data/reviews/Review";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils";
import { createTestApp } from "../../../../test-util/app";
import { genUser } from "@gram/core/dist/test-util/authz";
import { createSampleModel } from "../../../../test-util/model";
import { sampleReviewer } from "../../../../test-util/sampleReviewer";
import { sampleOtherUser, sampleUser } from "../../../../test-util/sampleUser";

describe("Reviews.changeReviewer", () => {
  const validate = jest.spyOn(jwt, "validateToken");

  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  let modelId: string;
  let review: Review;

  beforeAll(async () => {
    pool = await createPostgresPool();
    ({ app, dal, pool } = await createTestApp());
  });

  beforeEach(async () => {
    validate.mockImplementation(async () =>
      genUser({ roles: [Role.Reviewer] })
    );

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
    validate.mockImplementation(async () => sampleOtherUser);
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/change-reviewer`)
      .set("Authorization", "bearer validToken")
      .send({ newReviewer: sampleReviewer.sub });

    expect(res.status).toBe(403);
  });

  it("should return 200 on successful change-reviewer", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/change-reviewer`)
      .set("Authorization", "bearer validToken")
      .send({ newReviewer: sampleReviewer.sub });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();
  });

  it("should return 400 on invalid data sent to change-reviewer", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/change-reviewer`)
      .set("Authorization", "bearer validToken")
      .send({ hello: "world" });

    expect(res.status).toBe(400);
  });

  it("should return 400 on non-user reviewer sent to change-reviewer", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}/change-reviewer`)
      .set("Authorization", "bearer validToken")
      .send({ newReviewer: sampleUser.sub });

    expect(res.status).toBe(400);
  });

  afterAll(async () => {
    validate.mockRestore();
    await _deleteAllTheThings(pool);
  });
});
