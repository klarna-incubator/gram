/**
 * @exports systemsV1
 */
import list from "./list";
import get from "./get";
import permission from "./permissions";
import { DataAccessLayer } from "@gram/core/dist/data/dal";

const systemsV1 = (dal: DataAccessLayer) => ({
  list: list(dal),
  get,
  permission,
});

export default systemsV1;
