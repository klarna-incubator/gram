import request from "supertest";
import * as jwt from "../../../../auth/jwt";
import * as dataSystems from "../../../../data/systems";
import { genUser } from "../../../../test-util/authz";
import { sampleUser } from "../../../../test-util/sampleUser";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem";
import { createTestApp } from "../../../../test-util/app";
import { getMockedSystemById } from "../../../../test-util/system";

const validate = jest.spyOn(jwt, "validateToken");
const getById = jest.spyOn(dataSystems, "getById");

describe("systems.get", () => {
  let app: any;

  beforeAll(async () => {
    ({ app } = await createTestApp());
  });

  beforeEach(() => {
    validate.mockImplementation(async () => sampleUser);
    getById.mockImplementation(getMockedSystemById);
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get("/api/v1/systems/123");
    expect(res.status).toBe(401);
  });

  it("should return 403 on unauthorized", async () => {
    validate.mockImplementation(async () => genUser({ roles: [] }));

    const res = await request(app)
      .get("/api/v1/systems/234")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(403);
  });

  it("should return 404 on invalid system id", async () => {
    getById.mockImplementation(async () => null);

    const res = await request(app)
      .get("/api/v1/systems/234")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(404);
  });

  it("should return 500 on unknown error from get()", async () => {
    getById.mockImplementation(() => {
      throw new Error("Unknown");
    });

    const res = await request(app)
      .get("/api/v1/systems/123")
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(500);
  });

  it("should return 200 with dummy data", async () => {
    const res = await request(app)
      .get("/api/v1/systems/" + sampleOwnedSystem.id)
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(200);
    expect(res.body.system).toEqual(sampleOwnedSystem.toJSON());
  });

  afterAll(() => {
    validate.mockRestore();
    getById.mockRestore();
  });
});
