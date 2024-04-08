import { jest } from "@jest/globals";
import request from "supertest";
import * as jwt from "@gram/core/dist/auth/jwt.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { createTestApp } from "../../../../test-util/app.js";
import { createSampleModel } from "../../../../test-util/model.js";
import { sampleAdmin, sampleUser } from "../../../../test-util/sampleUser.js";
import {
  sampleAdminToken,
  sampleOtherUserToken,
  sampleUserToken,
} from "../../../../test-util/sampleTokens.js";

describe("models.setShouldReviewActionItems", () => {
  let app: any;
  let dal: DataAccessLayer;
  let url: string;
  let token = "";

  beforeAll(async () => {
    token = await sampleAdminToken();
    ({ app, dal } = await createTestApp());
    const modelId = await createSampleModel(dal);
    url = `/api/v1/models/${modelId}/set-should-review-action-items`;
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app)
      .patch(url)
      .send({ shouldReviewActionItems: false });
    expect(res.status).toBe(401);
  });

  it("should return 403 on unauthorized request (non-owning user)", async () => {
    const otherUserToken = await sampleOtherUserToken();

    const res = await request(app)
      .patch(url)
      .set("Authorization", otherUserToken)
      .send({ shouldReviewActionItems: false });
    expect(res.status).toBe(403);
  });

  it("should return 200 on admin request", async () => {
    let res = await request(app)
      .patch(url)
      .set("Authorization", token)
      .send({ shouldReviewActionItems: false });
    expect(res.status).toBe(200);

    res = await request(app)
      .patch(url)
      .set("Authorization", token)
      .send({ shouldReviewActionItems: false });
    expect(res.status).toBe(200);
  });

  it("should return 400 on bad request", async () => {
    const res = await request(app)
      .patch(url)
      .set("Authorization", token)
      .send({ shouldReviewActionItems: "hej" });
    expect(res.status).toBe(400);
  });
});
