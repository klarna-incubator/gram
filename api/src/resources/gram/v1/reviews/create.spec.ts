import { randomUUID } from "crypto";
import { Pool } from "pg";
import request from "supertest";
import * as jwt from "../../../../auth/jwt";
import { Role } from "../../../../auth/models/Role";
import { DataAccessLayer } from "../../../../data/dal";
import * as dataSystems from "../../../../data/systems";
import { _deleteAllTheThings } from "../../../../data/utils";
import { createTestApp } from "../../../../test-util/app";
import { createSampleModel } from "../../../../test-util/model";
import {
  sampleAdmin,
  sampleOtherUser,
  sampleUser,
} from "../../../../test-util/sampleUser";

describe("reviews.create", () => {
  let app: any;
  let pool: Pool;
  let modelId: any;
  let dal: DataAccessLayer;

  const validate = jest.spyOn(jwt, "validateToken");
  const systemGetById = jest.spyOn(dataSystems, "getById");

  beforeAll(async () => {
    ({ app, dal, pool } = await createTestApp());
  });

  beforeEach(async () => {
    validate.mockImplementation(async () => sampleUser);

    /** Set up test model needed for review **/
    modelId = await createSampleModel(dal);
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${randomUUID()}`)
      .send({ reviewedBy: "some-user" });
    expect(res.status).toBe(401);
  });

  it("should return 403 on un-authorized request (different team)", async () => {
    validate.mockImplementation(async () => {
      return sampleOtherUser;
    });

    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}`)
      .set("Authorization", "bearer validToken")
      .send({ reviewedBy: "some-user" });
    expect(res.status).toBe(403);
  });

  it("should return 200 and review object on user request", async () => {
    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}`)
      .set("Authorization", "bearer validToken")
      .send({
        reviewedBy: "another user",
      });
    expect(res.status).toBe(200);
    expect(res.body.review.requestedBy).toEqual("test@abc.xyz");
    expect(res.body.review.reviewedBy).toEqual("another user");
  });

  it("should return 200 and review object on admin request", async () => {
    validate.mockImplementation(async () => sampleAdmin);

    const res = await request(app)
      .post(`/api/v1/reviews/${modelId}`)
      .set("Authorization", "bearer validToken")
      .send({
        reviewedBy: "another user",
      });
    expect(res.status).toBe(200);
    expect(res.body.review.requestedBy).toEqual(sampleAdmin.sub);
    expect(res.body.review.reviewedBy).toEqual("another user");
  });

  afterAll(async () => {
    validate.mockRestore();
    systemGetById.mockRestore();
    await _deleteAllTheThings(pool);
  });
});
