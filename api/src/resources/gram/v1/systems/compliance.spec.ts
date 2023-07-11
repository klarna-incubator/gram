import * as jwt from "@gram/core/dist/auth/jwt";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { Review, ReviewStatus } from "@gram/core/dist/data/reviews/Review";
// import { createSampleModel } from "api/src/test-util/model";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app";
import { genUser } from "@gram/core/dist/test-util/authz";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem";
import { sampleUser } from "../../../../test-util/sampleUser";
import { createSampleModel } from "../../../../test-util/model";

const validate = jest.spyOn(jwt, "validateToken");

describe("systems.get", () => {
  let app: any;
  let dal: DataAccessLayer;
  let modelId: string;
  let review: Review;

  beforeAll(async () => {
    ({ app, dal } = await createTestApp());
  });

  beforeEach(async () => {
    validate.mockImplementation(async () => sampleUser);

    /** Set up test model needed for review **/
    modelId = await createSampleModel(dal);

    review = new Review(
      modelId,
      "some-user",
      ReviewStatus.Requested,
      "some-reviewer"
    );
    await dal.reviewService.create(review);
    await dal.reviewService.approve(modelId, "some-reviewer");
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get("/api/v1/systems/123/compliance");
    expect(res.status).toBe(401);
  });

  it("should return 404 on invalid system id", async () => {
    const res = await request(app)
      .get("/api/v1/systems/234/compliance")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(404);
  });

  it("should return 200 with dummy data", async () => {
    const res = await request(app)
      .get("/api/v1/systems/" + sampleOwnedSystem.id + "/compliance")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(200);
    expect(res.body.compliance.approved_model_id).toEqual(modelId);
  });

  afterAll(() => {
    validate.mockRestore();
  });
});
