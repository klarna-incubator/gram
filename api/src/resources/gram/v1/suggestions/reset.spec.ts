import { randomUUID } from "crypto";
import request from "supertest";
import * as jwt from "@gram/core/dist/auth/jwt.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { createPostgresPool } from "@gram/core/dist/data/postgres.js";
import { SuggestionStatus } from "@gram/core/dist/data/suggestions/Suggestion.js";
import { systemProvider } from "@gram/core/dist/data/systems/systems.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import { createTestApp } from "../../../../test-util/app.js";
import { createSampleModel } from "../../../../test-util/model.js";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem.js";
import {
  sampleOtherUser,
  sampleUser,
} from "../../../../test-util/sampleUser.js";
import {
  genSuggestedControl,
  genSuggestedThreat,
} from "../../../../test-util/suggestions.js";

describe("Suggestions.reset", () => {
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
    const res = await request(app)
      .patch(`/api/v1/suggestions/${modelId}/reset`)
      .send({ suggestionId: genSuggestedControl().id.val });
    expect(res.status).toBe(401);
  });

  it("should return 400 on bad modelId", async () => {
    const res = await request(app)
      .patch(`/api/v1/suggestions/kanelbulle/reset`)
      .set("Authorization", "bearer validToken")
      .send({ suggestionId: genSuggestedControl().id.val });
    expect(res.status).toBe(400);
  });

  it("should return 400 on bad suggestionId", async () => {
    const res = await request(app)
      .patch(`/api/v1/suggestions/kanelbulle/reset`)
      .set("Authorization", "bearer validToken")
      .send({ suggestionId: randomUUID() });
    expect(res.status).toBe(400);
  });

  it("should return 403 on unauthorized request (default user)", async () => {
    validate.mockImplementation(async () => sampleOtherUser);

    const res = await request(app)
      .patch(`/api/v1/suggestions/${modelId}/reset`)
      .set("Authorization", "bearer validToken")
      .send({ suggestionId: genSuggestedControl().id.val });

    expect(res.status).toBe(403);
  });

  it("should return 200 on successful reset for control", async () => {
    const control = genSuggestedControl();

    await dal.suggestionService.bulkInsert(modelId, {
      sourceSlug: "",
      controls: [control],
      threats: [],
    });
    const res = await request(app)
      .patch(`/api/v1/suggestions/${modelId}/reset`)
      .set("Authorization", "bearer validToken")
      .send({ suggestionId: control.id.val });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();

    const controls = await dal.suggestionService.listControlSuggestions(
      modelId
    );
    expect(controls[0].status).toBe(SuggestionStatus.New);
  });

  it("should return 200 on successful reset for threat", async () => {
    const threat = genSuggestedThreat();

    await dal.suggestionService.bulkInsert(modelId, {
      sourceSlug: "",
      controls: [],
      threats: [threat],
    });
    const res = await request(app)
      .patch(`/api/v1/suggestions/${modelId}/reset`)
      .set("Authorization", "bearer validToken")
      .send({ suggestionId: threat.id.val });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();

    const threats = await dal.suggestionService.listThreatSuggestions(modelId);
    expect(threats[0].status).toBe(SuggestionStatus.New);
  });

  it("should return 404 on invalid suggestion-id", async () => {
    const res = await request(app)
      .patch(`/api/v1/suggestions/${modelId}/reset`)
      .set("Authorization", "bearer validToken")
      .send({ suggestionId: genSuggestedControl().id.val });

    expect(res.status).toBe(404);
  });

  afterAll(async () => {
    validate.mockRestore();
    systemGetById.mockRestore();
    await _deleteAllTheThings(pool);
  });
});
