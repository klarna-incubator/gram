import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import accept from "./accept.js";
import list from "./list.js";
import reject from "./reject.js";
import reset from "./reset.js";

export default (dal: DataAccessLayer) => ({
  accept: accept(dal),
  list: list(dal),
  reject: reject(dal),
  reset: reset(dal),
});
