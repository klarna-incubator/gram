/**
 * @exports systemsV1
 */
import list from "./list.js";
import get from "./get.js";
import permission from "./permissions.js";
import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import compliance from "./compliance.js";

const systemsV1 = (dal: DataAccessLayer) => ({
  list: list(dal),
  get,
  compliance: compliance(dal),
  permission,
});

export default systemsV1;
