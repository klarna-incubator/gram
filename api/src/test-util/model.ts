import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model from "@gram/core/dist/data/models/Model.js";
import { sampleOwnedSystem } from "./sampleOwnedSystem.js";

export async function createSampleModel(
  dal: DataAccessLayer,
  owner: string = "root"
) {
  const model = new Model(sampleOwnedSystem.id, "some-version", owner);
  model.data = { components: [], dataFlows: [] };
  const modelId = await dal.modelService.create(model);
  return modelId;
}
