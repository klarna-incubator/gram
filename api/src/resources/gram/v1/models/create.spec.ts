import { jest } from "@jest/globals";
import pg from "pg";
import request from "supertest";
import * as jwt from "@gram/core/dist/auth/jwt.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model, { Component } from "@gram/core/dist/data/models/Model.js";
import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import { createTestApp } from "../../../../test-util/app.js";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem.js";
import {
  sampleAdmin,
  sampleOtherUser,
  sampleUser,
} from "../../../../test-util/sampleUser.js";

describe("models.create", () => {
  const validate = jest.spyOn(jwt, "validateToken");
  const componentId = "fe93572e-9d0c-4afe-b042-e02c1c45f704";
  const componentId2 = "fe93572e-9d0c-4afe-b042-e02c1c459999";
  const dataFlowId = "fe93572e-9d0c-4afe-b042-e02c1cstonks";
  let app: any;
  let pool: pg.Pool;
  let dal: DataAccessLayer;

  beforeAll(async () => {
    ({ app, dal, pool } = await createTestApp());
  });

  beforeEach(async () => {
    await _deleteAllTheThings(pool);
  });

  beforeEach(() => {
    validate.mockImplementation(async () => sampleUser);

    // modelGetById.mockImplementation(async () => {
    // const model = new Model("sys1", "Version 1", "root");
    // model.id = "mod1";
    // return model;
    // });
  });

  afterAll(() => {
    validate.mockRestore();
  });

  it("should return 401 on un-authenticated request", async () => {
    const res = await request(app)
      .post("/api/v1/models")
      .send({ version: "Some Model", systemId: sampleOwnedSystem.id });
    expect(res.status).toBe(401);
  });

  it("should return 403 on unauthorized request (different team)", async () => {
    validate.mockImplementation(async () => sampleOtherUser);

    const res = await request(app)
      .post("/api/v1/models")
      .set("Authorization", "bearer validToken")
      .send({ version: "Some Model", systemId: sampleOwnedSystem.id });
    expect(res.status).toBe(403);
  });

  it("should return 200 on admin request", async () => {
    validate.mockImplementation(async () => sampleAdmin);

    const res = await request(app)
      .post("/api/v1/models")
      .set("Authorization", "bearer validToken")
      .send({ version: "Some Model", systemId: sampleOwnedSystem.id });
    expect(res.status).toBe(200);
  });

  it("should return 200 on admin request", async () => {
    const res = await request(app)
      .post("/api/v1/models")
      .set("Authorization", "bearer validToken")
      .send({ version: "Some Model", systemId: sampleOwnedSystem.id });
    expect(res.status).toBe(200);
  });

  it("should return 200 on every request and import model/threats/controls", async () => {
    // modelGetById.mockImplementation(async () => {});
    // 1) Create model A
    const res = await request(app)
      .post("/api/v1/models")
      .set("Authorization", "bearer validToken")
      .send({
        version: "Some Model to be imported from",
        systemId: sampleOwnedSystem.id,
      });
    expect(res.status).toBe(200);
    const modelId = res.body.model.id;

    // 2) Create some components
    // Assuming componentId = "fe93572e-9d0c-4afe-b042-e02c1c45f704"
    const patchRes = await request(app)
      .patch(`/api/v1/models/${modelId}`)
      .set("Authorization", "bearer validToken")
      .send({
        version: "Some Model to be imported from",
        data: {
          components: [
            { id: componentId, x: 0, y: 0, type: "ee", name: "omegalul" },
            { id: componentId2, x: 1, y: 1, type: "ds", name: "hello" },
          ],
          dataFlows: [
            {
              id: dataFlowId,
              endComponent: { id: componentId },
              startComponent: { id: componentId2 },
              points: [0, 0],
              bidirectional: false,
            },
          ],
        },
      });
    expect(patchRes.status).toBe(200);

    const modelRes = await request(app)
      .get(`/api/v1/models/${modelId}`)
      .set("Authorization", "bearer validToken");
    expect(modelRes.status).toBe(200);
    const model: Model = modelRes.body.model;

    // 3) Create some threats for modelId & componentId
    const threatsAmount = 8;
    const threatTitle = "Threat to be imported";
    const threatDescription = "something to be imported";
    const threatTitle2 = "Another threat to be imported";
    const threatDescription2 = "hmm another something to be imported";

    for (let i = 1; i <= threatsAmount; i++) {
      if (i > threatsAmount / 2) {
        const res2 = await request(app)
          .post(`/api/v1/models/${modelId}/threats`)
          .set("Authorization", "bearer validToken")
          .send({
            title: threatTitle,
            componentId: componentId,
            description: threatDescription,
          });
        expect(res2.status).toBe(200);
      } else {
        const res2 = await request(app)
          .post(`/api/v1/models/${modelId}/threats`)
          .set("Authorization", "bearer validToken")
          .send({
            title: threatTitle2,
            componentId: componentId2,
            description: threatDescription2,
          });
        expect(res2.status).toBe(200);
      }
    }

    const resThreats = await request(app)
      .get(`/api/v1/models/${modelId}/threats`)
      .set("Authorization", "bearer validToken");
    expect(resThreats.status).toBe(200);
    const threats = resThreats.body.threats;

    // 3) Create some controls for modelId & componentId
    const controlsAmount = 8;
    const controlTitle = "Control to be imported";
    const controlDescription = "something well to be imported";
    const controlTitle2 = "Another control to be imported";
    const controlDescription2 = "nothing something well to be imported";

    for (let i = 1; i <= controlsAmount; i++) {
      if (i > controlsAmount / 2) {
        const res4 = await request(app)
          .post(`/api/v1/models/${modelId}/controls`)
          .set("Authorization", "bearer validToken")
          .send({
            title: controlTitle,
            description: controlDescription,
            componentId: componentId,
          });
        expect(res4.status).toBe(200);
      } else {
        const res4 = await request(app)
          .post(`/api/v1/models/${modelId}/controls`)
          .set("Authorization", "bearer validToken")
          .send({
            title: controlTitle2,
            description: controlDescription2,
            componentId: componentId2,
          });
        expect(res4.status).toBe(200);
      }
    }

    const resControls = await request(app)
      .get(`/api/v1/models/${modelId}/controls`)
      .set("Authorization", "bearer validToken");
    expect(resControls.status).toBe(200);
    const controls = resControls.body.controls;

    // 5) Create some mitigations between threats and controls
    const mitigationsAmount = 4;

    for (let i = 0; i < mitigationsAmount; i++) {
      const res4 = await request(app)
        .post(`/api/v1/models/${modelId}/mitigations`)
        .set("Authorization", "bearer validToken")
        .send({
          threatId: threats[i].id,
          controlId: controls[i].id,
        });
      expect(res4.status).toBe(200);
    }

    const resMitigations = await request(app)
      .get(`/api/v1/models/${modelId}/mitigations`)
      .set("Authorization", "bearer validToken");
    expect(resMitigations.status).toBe(200);
    const mitigations = resMitigations.body.mitigations;

    // 6) Create a new model B importing from model A
    const res5 = await request(app)
      .post("/api/v1/models")
      .set("Authorization", "bearer validToken")
      .send({
        version: "Some Model imported",
        systemId: sampleOwnedSystem.id,
        sourceModelId: modelId,
      });
    expect(res5.status).toBe(200);
    const modelCopyId = res5.body.model.id;

    const modelCopyRes = await request(app)
      .get(`/api/v1/models/${modelCopyId}`)
      .set("Authorization", "bearer validToken");
    expect(modelCopyRes.status).toBe(200);
    const modelCopy: Model = modelCopyRes.body.model;

    for (let i = 0; i < modelCopy.data.components.length; i++) {
      const mC = modelCopy.data.components[i];
      const m = model.data.components[i];
      expect(mC.id).not.toBe(m.id);
      expect(mC.name).toBe(m.name);
      expect(mC.type).toBe(m.type);
      expect(mC.x).toBe(m.x);
      expect(mC.y).toBe(m.y);
    }

    for (let i = 0; i < modelCopy.data.dataFlows.length; i++) {
      const mC = modelCopy.data.dataFlows[i];
      const m = model.data.dataFlows[i];
      expect(mC.id).not.toBe(m.id);
      expect(mC.endComponent).not.toEqual(m.endComponent);
      expect(mC.startComponent).not.toEqual(m.startComponent);
      expect(
        modelCopy.data.components.find(
          (c: Component) => c.id === mC.endComponent.id
        )?.name
      ).toBe(
        model.data.components.find((c: Component) => c.id === m.endComponent.id)
          ?.name
      );
      expect(mC.points).toEqual(m.points);
    }

    // 6) Get copied threats
    const res6 = await request(app)
      .get(`/api/v1/models/${modelCopyId}/threats`)
      .set("Authorization", "bearer validToken");
    expect(res6.status).toBe(200);
    expect(res6.body.threats.length).toBe(threatsAmount);
    const threatCopies = res6.body.threats;

    // 7) Get copied controls
    const res7 = await request(app)
      .get(`/api/v1/models/${modelCopyId}/controls`)
      .set("Authorization", "bearer validToken");
    expect(res7.status).toBe(200);
    expect(res7.body.controls.length).toBe(controlsAmount);
    const controlCopies = res7.body.threats;

    // 8) Get copied mitigations
    const res8 = await request(app)
      .get(`/api/v1/models/${modelCopyId}/mitigations`)
      .set("Authorization", "bearer validToken");
    expect(res8.status).toBe(200);
    expect(res8.body.mitigations.length).toBe(mitigationsAmount);
    const mitigationCopies = res8.body.mitigations;
  });

  // TODO missing tests: non-system attached models. Fetching after create. Importing models. Authz on imported / non-system attached model.
});
