import deleteToken from "./delete";
import getAuthToken from "./get";
import getAuthParams from "./params";

const tokenV1 = {
  get: getAuthToken,
  delete: deleteToken,
  params: getAuthParams,
};

export default tokenV1;
