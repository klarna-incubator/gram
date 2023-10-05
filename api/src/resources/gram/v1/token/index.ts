import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import deleteToken from "./delete.js";
import { getAuthToken } from "./get.js";
import getAuthParams from "./params.js";

const tokenV1 = (dal: DataAccessLayer) => ({
  get: getAuthToken(dal),
  delete: deleteToken,
  params: getAuthParams,
});

export default tokenV1;
