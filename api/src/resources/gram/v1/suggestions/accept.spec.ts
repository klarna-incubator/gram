import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { createPostgresPool } from "@gram/core/dist/data/postgres.js";
import { SuggestionStatus } from "@gram/core/dist/data/suggestions/Suggestion.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import { createSampleModel } from "../../../../test-util/model.js";
import {
  sampleOtherUserToken,
  sampleUserToken,
} from "../../../../test-util/sampleTokens.js";
import {
  genSuggestedControl,
  genSuggestedThreat,
} from "../../../../test-util/suggestions.js";
import { sampleUser } from "../../../../test-util/sampleUser.js";

const suggestion = genSuggestedControl();

describe("Suggestions.accept", () => {
  let app: any;
  let pool: any;
  let dal: DataAccessLayer;
  let modelId: string;
  let token = "";

  beforeAll(async () => {
    token = await sampleUserToken();
    pool = await createPostgresPool();
    ({ app, dal } = await createTestApp());
  });

  beforeEach(async () => {
    modelId = await createSampleModel(dal, sampleUser.sub);
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app)
      .patch(`/api/v1/suggestions/${modelId}/accept`)
      .send({ suggestionId: suggestion.id.val });
    expect(res.status).toBe(401);
  });

  it("should return 400 on bad modelId", async () => {
    const res = await request(app)
      .patch(`/api/v1/suggestions/kanelbulle/accept`)
      .set("Authorization", token)
      .send({ suggestionId: suggestion.id.val });
    expect(res.status).toBe(400);
  });

  it("should return 403 on unauthorized request (default user)", async () => {
    const otherToken = await sampleOtherUserToken();

    const res = await request(app)
      .patch(`/api/v1/suggestions/${modelId}/accept`)
      .set("Authorization", otherToken)
      .send({ suggestionId: suggestion.id.val });

    expect(res.status).toBe(403);
  });

  it("should return 200 on successful accept for control", async () => {
    const control = genSuggestedControl();

    await dal.suggestionService.bulkInsert(modelId, {
      sourceSlug: "",
      controls: [control],
      threats: [],
    });
    const res = await request(app)
      .patch(`/api/v1/suggestions/${modelId}/accept`)
      .set("Authorization", token)
      .send({ suggestionId: control.id.val });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();

    const controls = await dal.suggestionService.listControlSuggestions(
      modelId
    );
    expect(controls[0].status).toBe(SuggestionStatus.Accepted);
  });

  it("should return 200 on successful accept for threat", async () => {
    const threat = genSuggestedThreat();

    await dal.suggestionService.bulkInsert(modelId, {
      sourceSlug: "",
      controls: [],
      threats: [threat],
    });
    const res = await request(app)
      .patch(`/api/v1/suggestions/${modelId}/accept`)
      .set("Authorization", token)
      .send({ suggestionId: threat.id.val });

    expect(res.status).toBe(200);
    expect(res.body.result).toBeTruthy();

    const threats = await dal.suggestionService.listThreatSuggestions(modelId);
    expect(threats[0].status).toBe(SuggestionStatus.Accepted);
  });

  it("should return 404 on invalid suggestion-id", async () => {
    const res = await request(app)
      .patch(`/api/v1/suggestions/${modelId}/accept`)
      .set("Authorization", token)
      .send({ suggestionId: suggestion.id.val });

    expect(res.status).toBe(404);
  });

  afterAll(async () => {
    await _deleteAllTheThings(pool);
  });
});
