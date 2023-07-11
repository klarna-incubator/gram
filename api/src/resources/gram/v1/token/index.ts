import { DataAccessLayer } from "@gram/core/dist/data/dal";
import deleteToken from "./delete";
import { getAuthToken } from "./get";
import getAuthParams from "./params";

const tokenV1 = (dal: DataAccessLayer) => ({
  get: getAuthToken(dal),
  delete: deleteToken,
  params: getAuthParams,
});

export default tokenV1;
