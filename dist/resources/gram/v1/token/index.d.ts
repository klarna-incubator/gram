import getCsrfToken from "./csrf";
import deleteToken from "./delete";
import getAuthToken from "./get";
import getAuthParams from "./params";
declare const tokenV1: {
    csrf: typeof getCsrfToken;
    get: typeof getAuthToken;
    delete: typeof deleteToken;
    params: typeof getAuthParams;
};
export default tokenV1;
//# sourceMappingURL=index.d.ts.map