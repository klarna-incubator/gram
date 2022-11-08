import { DataAccessLayer } from "../../../../data/dal";
import accept from "./accept";
import list from "./list";
import reject from "./reject";
import reset from "./reset";

export default (dal: DataAccessLayer) => ({
  accept: accept(dal),
  list: list(dal),
  reject: reject(dal),
  reset: reset(dal),
});
