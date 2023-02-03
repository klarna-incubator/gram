import request from "supertest";
import * as jwt from "@gram/core/dist/auth/jwt";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { createTestApp } from "../../../../test-util/app";
import { createSampleModel } from "../../../../test-util/model";
import { sampleAdmin, sampleUser } from "../../../../test-util/sampleUser";

describe("models.setTemplate", () => {
  const validate = jest.spyOn(jwt, "validateToken");
  let app: any;
  let dal: DataAccessLayer;
  let url: string;

  beforeAll(async () => {
    ({ app, dal } = await createTestApp());
    const modelId = await createSampleModel(dal);
    url = `/api/v1/models/${modelId}/set-template`;
  });

  beforeEach(() => {
    validate.mockImplementation(async () => sampleAdmin);
  });

  afterAll(() => {
    validate.mockRestore();
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).patch(url).send({ isTemplate: true });
    expect(res.status).toBe(401);
  });

  it("should return 403 on unauthorized request (wrong role)", async () => {
    validate.mockImplementation(async () => sampleUser);

    const res = await request(app)
      .patch(url)
      .set("Authorization", "bearer validToken")
      .send({ isTemplate: true });
    expect(res.status).toBe(403);
  });

  it("should return 200 on admin request", async () => {
    let res = await request(app)
      .patch(url)
      .set("Authorization", "bearer validToken")
      .send({ isTemplate: true });
    expect(res.status).toBe(200);

    res = await request(app)
      .patch(url)
      .set("Authorization", "bearer validToken")
      .send({ isTemplate: false });
    expect(res.status).toBe(200);
  });

  it("should return 400 on bad request", async () => {
    const res = await request(app)
      .patch(url)
      .set("Authorization", "bearer validToken")
      .send({ isTemplate: "hej" });
    expect(res.status).toBe(400);
  });
});
