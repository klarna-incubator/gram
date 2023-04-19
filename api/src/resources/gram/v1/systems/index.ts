/**
 * @exports systemsV1
 */
import list from "./list";
import get from "./get";
import permission from "./permissions";
import { DataAccessLayer } from "@gram/core/dist/data/dal";
import compliance from "./compliance";

const systemsV1 = (dal: DataAccessLayer) => ({
  list: list(dal),
  get,
  compliance: compliance(dal),
  permission,
});

export default systemsV1;
