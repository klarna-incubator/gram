import request from "supertest";
import * as jwt from "@gram/core/dist/auth/jwt";
import { Role } from "@gram/core/dist/auth/models/Role";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { Review, ReviewStatus } from "@gram/core/dist/data/reviews/Review";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils";
import { createTestApp } from "../../../../test-util/app";
import { genUser } from "@gram/core/dist/test-util/authz";
import { createSampleModel } from "../../../../test-util/model";
import { sampleOtherUser, sampleUser } from "../../../../test-util/sampleUser";

describe("Reviews.update", () => {
  const validate = jest.spyOn(jwt, "validateToken");

  let app: any;
  let pool: any;
  let modelId: string;
  let review: Review;
  let dal: DataAccessLayer;

  beforeAll(async () => {
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
      .set("Authorization", "bearer validToken")
      .send({ status: "approved" });

    expect(res.status).toBe(400);
  });

  it("should return 403 on authorized request (called by role.user)", async () => {
    validate.mockImplementation(async () => sampleOtherUser);

    const res = await request(app)
      .patch(`/api/v1/reviews/${modelId}`)
      .set("Authorization", "bearer validToken")
      .send({ note: "new note", reviewedBy: "new reviewer" });

    expect(res.status).toBe(403);
  });

  it("should return on updating note + reviewer (called by role.reviewer)", async () => {
    const res = await request(app)
      .patch(`/api/v1/reviews/${modelId}`)
      .set("Authorization", "bearer validToken")
      .send({ note: "new note", reviewedBy: "new reviewer" });

    expect(res.status).toBe(200);
    expect(res.body.review.modelId).toEqual(modelId);
    expect(res.body.review.note).toEqual("new note");
  });

  it("should return 200 on updating note", async () => {
    const res = await request(app)
      .patch(`/api/v1/reviews/${modelId}`)
      .set("Authorization", "bearer validToken")
      .send({ note: "A new note" });

    expect(res.status).toBe(200);
    expect(res.body.review.modelId).toEqual(modelId);
    expect(res.body.review.note).toEqual("A new note");
  });

  it("should return 200 on updating reviewer (called by role.reviewer)", async () => {
    const res = await request(app)
      .patch(`/api/v1/reviews/${modelId}`)
      .set("Authorization", "bearer validToken")
      .send({ reviewedBy: "new reviewer" });

    expect(res.status).toBe(200);
    expect(res.body.review.modelId).toEqual(modelId);
    expect(res.body.review.reviewedBy).toEqual("new reviewer");
  });

  afterAll(async () => {
    validate.mockRestore();
    await _deleteAllTheThings(pool);
  });
});
