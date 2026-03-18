import { _deleteAllTheThings } from "@gram/core/dist/data/utils.js";
import request from "supertest";
import { createTestApp } from "../../../../test-util/app.js";
import {
  sampleOtherUserToken,
  sampleUserToken,
} from "../../../../test-util/sampleTokens.js";
import { sampleOwnedSystem } from "../../../../test-util/sampleOwnedSystem.js";

describe("models.jsonTransfer", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let app: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let dal: any;
  let token = "";
  let otherToken = "";

  beforeAll(async () => {
    token = await sampleUserToken();
    otherToken = await sampleOtherUserToken();
    ({ app, dal } = await createTestApp());
  });

  beforeEach(async () => {
    await _deleteAllTheThings(dal.pool);
  });

  async function createSourceModel() {
    const createRes = await request(app)
      .post("/api/v1/models")
      .set("Authorization", token)
      .send({
        version: "Source model",
        systemId: sampleOwnedSystem.id,
      });
    const sourceModelId = createRes.body.model.id;

    const componentA = "0da2f2ba-7f97-47d9-a2f1-8be214e01b11";
    const componentB = "0da2f2ba-7f97-47d9-a2f1-8be214e01b22";
    const dataFlow = "0da2f2ba-7f97-47d9-a2f1-8be214e01b33";

    await request(app)
      .patch(`/api/v1/models/${sourceModelId}`)
      .set("Authorization", token)
      .send({
        version: "Source model",
        data: {
          components: [
            { id: componentA, x: 1, y: 1, type: "ee", name: "Frontend" },
            { id: componentB, x: 2, y: 2, type: "proc", name: "API" },
          ],
          dataFlows: [
            {
              id: dataFlow,
              endComponent: { id: componentB },
              startComponent: { id: componentA },
              points: [1, 1, 2, 2],
              bidirectional: false,
            },
          ],
        },
      });

    await request(app)
      .post(`/api/v1/models/${sourceModelId}/threats`)
      .set("Authorization", token)
      .send({
        title: "Spoofing",
        description: "Spoofing threat",
        componentId: componentA,
      });

    await request(app)
      .post(`/api/v1/models/${sourceModelId}/controls`)
      .set("Authorization", token)
      .send({
        title: "mTLS",
        description: "Mutual TLS",
        componentId: componentB,
      });

    const threatsRes = await request(app)
      .get(`/api/v1/models/${sourceModelId}/threats`)
      .set("Authorization", token);
    const controlsRes = await request(app)
      .get(`/api/v1/models/${sourceModelId}/controls`)
      .set("Authorization", token);

    await request(app)
      .post(`/api/v1/models/${sourceModelId}/mitigations`)
      .set("Authorization", token)
      .send({
        threatId: threatsRes.body.threats[0].id,
        controlId: controlsRes.body.controls[0].id,
      });

    return sourceModelId;
  }

  it("rejects unauthenticated export/import", async () => {
    const exportRes = await request(app).get(
      "/api/v1/models/00000000-0000-0000-0000-000000000000/export-json"
    );
    expect(exportRes.status).toBe(401);

    const importRes = await request(app)
      .post("/api/v1/models/import-json")
      .send({
        mode: "in-place",
        targetModelId: "00000000-0000-0000-0000-000000000000",
        payload: {},
      });
    expect(importRes.status).toBe(401);
  });

  it("requires authorization for export/import endpoints", async () => {
    const sourceModelId = await createSourceModel();

    const exportWithOtherUser = await request(app)
      .get(`/api/v1/models/${sourceModelId}/export-json`)
      .set("Authorization", otherToken);
    // In DefaultAuthzProvider, Role.User has read permission on models.
    expect(exportWithOtherUser.status).toBe(200);

    const exportRes = await request(app)
      .get(`/api/v1/models/${sourceModelId}/export-json`)
      .set("Authorization", token);

    const forbiddenImport = await request(app)
      .post("/api/v1/models/import-json")
      .set("Authorization", otherToken)
      .send({
        mode: "in-place",
        targetModelId: sourceModelId,
        payload: {
          ...exportRes.body.payload,
          model: {
            ...exportRes.body.payload.model,
            version: "Forbidden import",
          },
        },
      });
    expect(forbiddenImport.status).toBe(403);
  });

  it("exports and imports model JSON in in-place mode", async () => {
    const sourceModelId = await createSourceModel();
    const targetCreateRes = await request(app)
      .post("/api/v1/models")
      .set("Authorization", token)
      .send({
        version: "Import target model",
        systemId: sampleOwnedSystem.id,
      });
    const targetModelId = targetCreateRes.body.model.id;

    const exportRes = await request(app)
      .get(`/api/v1/models/${sourceModelId}/export-json`)
      .set("Authorization", token);
    expect(exportRes.status).toBe(200);
    expect(exportRes.body.payload.metadata.schemaVersion).toBe(1);

    const importRes = await request(app)
      .post("/api/v1/models/import-json")
      .set("Authorization", token)
      .send({
        mode: "in-place",
        targetModelId,
        payload: {
          ...exportRes.body.payload,
          model: {
            ...exportRes.body.payload.model,
            version: "Imported in-place model",
          },
        },
      });
    expect(importRes.status).toBe(200);
    expect(importRes.body.modelId).toBe(targetModelId);

    const importedModelId = importRes.body.modelId;
    const importedModelRes = await request(app)
      .get(`/api/v1/models/${importedModelId}`)
      .set("Authorization", token);
    expect(importedModelRes.status).toBe(200);
    expect(importedModelRes.body.model.version).toBe("Import target model");
    expect(importedModelRes.body.model.systemId).toBe(sampleOwnedSystem.id);

    const importedThreats = await request(app)
      .get(`/api/v1/models/${importedModelId}/threats`)
      .set("Authorization", token);
    const importedControls = await request(app)
      .get(`/api/v1/models/${importedModelId}/controls`)
      .set("Authorization", token);
    const importedMitigations = await request(app)
      .get(`/api/v1/models/${importedModelId}/mitigations`)
      .set("Authorization", token);

    expect(importedThreats.body.threats.length).toBe(1);
    expect(importedControls.body.controls.length).toBe(1);
    expect(importedMitigations.body.mitigations.length).toBe(1);
  });

  it("imports in in-place mode and keeps target model id", async () => {
    const sourceModelId = await createSourceModel();

    const targetCreateRes = await request(app)
      .post("/api/v1/models")
      .set("Authorization", token)
      .send({
        version: "Target model",
        systemId: sampleOwnedSystem.id,
      });
    const targetModelId = targetCreateRes.body.model.id;

    const exportRes = await request(app)
      .get(`/api/v1/models/${sourceModelId}/export-json`)
      .set("Authorization", token);

    const inPlaceImportRes = await request(app)
      .post("/api/v1/models/import-json")
      .set("Authorization", token)
      .send({
        mode: "in-place",
        targetModelId,
        payload: {
          ...exportRes.body.payload,
          model: {
            ...exportRes.body.payload.model,
            version: "In-place import version",
          },
        },
      });

    expect(inPlaceImportRes.status).toBe(200);
    expect(inPlaceImportRes.body.modelId).toBe(targetModelId);

    const targetModelRes = await request(app)
      .get(`/api/v1/models/${targetModelId}`)
      .set("Authorization", token);
    expect(targetModelRes.status).toBe(200);
    expect(targetModelRes.body.model.version).toBe("Target model");
  });

  it("imports in in-place mode and preserves target model metadata and review", async () => {
    const sourceCreateRes = await request(app)
      .post("/api/v1/models")
      .set("Authorization", token)
      .send({
        version: "Standalone source model",
      });
    const sourceModelId = sourceCreateRes.body.model.id;

    const targetCreateRes = await request(app)
      .post("/api/v1/models")
      .set("Authorization", token)
      .send({
        version: "System-bound target model",
        systemId: sampleOwnedSystem.id,
      });
    const targetModelId = targetCreateRes.body.model.id;
    await dal.modelService.setTemplate(targetModelId, true);
    await dal.modelService.setShouldReviewActionItems(targetModelId, true);

    const createReviewRes = await request(app)
      .post(`/api/v1/reviews/${targetModelId}`)
      .set("Authorization", token)
      .send({ reviewedBy: "reviewer@localhost" });
    expect(createReviewRes.status).toBe(200);

    const exportRes = await request(app)
      .get(`/api/v1/models/${sourceModelId}/export-json`)
      .set("Authorization", token);

    const inPlaceImportRes = await request(app)
      .post("/api/v1/models/import-json")
      .set("Authorization", token)
      .send({
        mode: "in-place",
        targetModelId,
        payload: {
          ...exportRes.body.payload,
          model: {
            ...exportRes.body.payload.model,
            version: "Imported over target model",
          },
        },
      });

    expect(inPlaceImportRes.status).toBe(200);
    expect(inPlaceImportRes.body.modelId).toBe(targetModelId);

    const targetModelRes = await request(app)
      .get(`/api/v1/models/${targetModelId}`)
      .set("Authorization", token);
    expect(targetModelRes.status).toBe(200);
    expect(targetModelRes.body.model.systemId).toBe(sampleOwnedSystem.id);
    expect(targetModelRes.body.model.version).toBe("System-bound target model");
    expect(targetModelRes.body.model.isTemplate).toBe(true);
    expect(targetModelRes.body.model.shouldReviewActionItems).toBe(true);

    const reviewRes = await request(app)
      .get(`/api/v1/reviews/${targetModelId}`)
      .set("Authorization", token);
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.review.status).toBe("requested");
  });

  it("preserves threat/control attachments to data-flow ids on import", async () => {
    const sourceModelId = await createSourceModel();

    const exportRes = await request(app)
      .get(`/api/v1/models/${sourceModelId}/export-json`)
      .set("Authorization", token);
    expect(exportRes.status).toBe(200);

    const flowId = exportRes.body.payload.modelData.dataFlows[0].id;
    const payload = {
      ...exportRes.body.payload,
      threats: exportRes.body.payload.threats.map((threat: any) => ({
        ...threat,
        componentId: flowId,
      })),
      controls: exportRes.body.payload.controls.map((control: any) => ({
        ...control,
        componentId: flowId,
      })),
    };

    const importRes = await request(app)
      .post("/api/v1/models/import-json")
      .set("Authorization", token)
      .send({
        mode: "in-place",
        targetModelId: sourceModelId,
        payload: {
          ...payload,
          model: {
            ...payload.model,
            version: "Imported flow attachment model",
          },
        },
      });
    expect(importRes.status).toBe(200);

    const importedModelId = importRes.body.modelId;
    const importedModelRes = await request(app)
      .get(`/api/v1/models/${importedModelId}`)
      .set("Authorization", token);
    expect(importedModelRes.status).toBe(200);

    const importedFlowIds = new Set(
      importedModelRes.body.model.data.dataFlows.map((df: any) => df.id)
    );

    const importedThreatsRes = await request(app)
      .get(`/api/v1/models/${importedModelId}/threats`)
      .set("Authorization", token);
    const importedControlsRes = await request(app)
      .get(`/api/v1/models/${importedModelId}/controls`)
      .set("Authorization", token);

    expect(importedThreatsRes.status).toBe(200);
    expect(importedControlsRes.status).toBe(200);
    expect(importedFlowIds.has(importedThreatsRes.body.threats[0].componentId)).toBe(
      true
    );
    expect(importedFlowIds.has(importedControlsRes.body.controls[0].componentId)).toBe(
      true
    );
  });
});
