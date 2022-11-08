import { DataAccessLayer } from "../../../../data/dal";
import { getProperties } from "./get";
import { listProperties } from "./properties";

export default (dal: DataAccessLayer) => ({
  get: getProperties(dal.sysPropHandler, dal.modelService),
  properties: listProperties(dal.sysPropHandler),
});
