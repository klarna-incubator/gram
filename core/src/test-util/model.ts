import { DataAccessLayer } from "../data/dal.js";
import Model from "../data/models/Model.js";
import { sampleOwnedSystem } from "./sampleOwnedSystem.js";

export async function createSampleModel(dal: DataAccessLayer) {
  const model = new Model(sampleOwnedSystem.id, "some-version", "root");
  model.data = { components: [], dataFlows: [] };
  const modelId = await dal.modelService.create(model);
  return modelId;
}
