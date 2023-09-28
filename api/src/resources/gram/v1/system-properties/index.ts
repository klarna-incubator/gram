import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { getProperties } from "./get.js";
import { listProperties } from "./properties.js";

export default (dal: DataAccessLayer) => ({
  get: getProperties(dal.sysPropHandler, dal.modelService),
  properties: listProperties(dal),
});
