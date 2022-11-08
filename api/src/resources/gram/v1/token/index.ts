import getCsrfToken from "./csrf";
import deleteToken from "./delete";
import getAuthToken from "./get";
import getAuthParams from "./params";

const tokenV1 = {
  csrf: getCsrfToken,
  get: getAuthToken,
  delete: deleteToken,
  params: getAuthParams,
};

export default tokenV1;
