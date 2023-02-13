import { DataAccessLayer } from "../data/dal";
import Model from "../data/models/Model";
import { sampleOwnedSystem } from "./sampleOwnedSystem";

export async function createSampleModel(dal: DataAccessLayer) {
  const model = new Model(sampleOwnedSystem.id, "some-version", "root");
  model.data = { components: [], dataFlows: [] };
  const modelId = await dal.modelService.create(model);
  return modelId;
}