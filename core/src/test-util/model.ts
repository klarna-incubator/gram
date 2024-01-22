import { randomUUID } from "crypto";
import { DataAccessLayer } from "../data/dal.js";
import Model from "../data/models/Model.js";
import { sampleOwnedSystem } from "./sampleOwnedSystem.js";

export async function createSampleModel(dal: DataAccessLayer) {
  const model = new Model(sampleOwnedSystem.id, "some-version", "root");
  const component1Id = randomUUID();
  const component2Id = randomUUID();
  const datafFlowId = randomUUID();
  model.data = {
    components: [
      { id: component1Id, x: 0, y: 0, type: "ee", name: "omegalul" },
      { id: component2Id, x: 1, y: 1, type: "ds", name: "hello" },
    ],
    dataFlows: [
      {
        id: datafFlowId,
        endComponent: { id: component1Id },
        startComponent: { id: component2Id },
        points: [0, 0],
        bidirectional: false,
      },
    ],
  };
  const modelId = await dal.modelService.create(model);
  return modelId;
}
