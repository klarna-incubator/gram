import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import Model, { ModelData } from "@gram/core/dist/data/models/Model.js";
import { sampleOwnedSystem } from "./sampleOwnedSystem.js";

export async function createSampleModel(
  dal: DataAccessLayer,
  owner: string = "root",
  data: ModelData = { components: [], dataFlows: [] }
) {
  const model = new Model(sampleOwnedSystem.id, "some-version", owner);
  model.data = data;
  const modelId = await dal.modelService.create(model);
  return modelId;
}
