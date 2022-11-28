import request from "supertest";
import * as jwt from "../../../../auth/jwt";
import { DataAccessLayer } from "../../../../data/dal";
import { createPostgresPool } from "../../../../data/postgres";
import { systemProvider } from "../../../../data/systems/systems";
import { _deleteAllTheThings } from "../../../../data/utils";
import { createTestApp } from "../../../../test-util/app";
import { genUser } from "../../../../test-util/authz";
import { createSampleModel } from "../../../../test-util/model";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem";
import { sampleUser } from "../../../../test-util/sampleUser";
import { genSuggestedControl } from "../../../../test-util/suggestions";

describe("Suggestions.list", () => {
  const validate = jest.spyOn(jwt, "validateToken");
  const systemGetById = jest.spyOn(systemProvider, "getSystem");

  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  let modelId: string;

  beforeAll(async () => {
    pool = await createPostgresPool();
    ({ app, dal } = await createTestApp());

    systemGetById.mockImplementation(async () => sampleOwnedSystem);
  });

  beforeEach(async () => {
    modelId = await createSampleModel(dal);

    validate.mockImplementation(async () => {
      return sampleUser;
    });
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app).get(`/api/v1/suggestions/${modelId}`);
    expect(res.status).toBe(401);
  });

  it("should return 400 on bad modelId", async () => {
    const res = await request(app)
      .get(`/api/v1/suggestions/kanelbulle`)
      .set("Authorization", "bearer validToken");
    expect(res.status).toBe(400);
  });

  it("should return 403 on unauthorized request (unroled user)", async () => {
    validate.mockImplementation(async () =>
      genUser({
        roles: [],
      })
    );

    const res = await request(app)
      .get(`/api/v1/suggestions/${modelId}`)
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(403);
  });

  it("should return 200 on successful list", async () => {
    const control = genSuggestedControl();

    await dal.suggestionService.bulkInsert(modelId, {
      sourceSlug: "",
      controls: [control],
      threats: [],
    });
    const res = await request(app)
      .get(`/api/v1/suggestions/${modelId}`)
      .set("Authorization", "bearer validToken");

    expect(res.status).toBe(200);
    expect(res.body.controls).toHaveLength(1);
    expect(res.body.threats).toHaveLength(0);
  });

  afterAll(async () => {
    validate.mockRestore();
    systemGetById.mockRestore();
    await _deleteAllTheThings(pool);
  });
});
