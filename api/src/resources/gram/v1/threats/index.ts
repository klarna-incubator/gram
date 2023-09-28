import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { create } from "./create.js";
import { _delete } from "./delete.js";
import { list } from "./list.js";
import { update } from "./update.js";

export default (dal: DataAccessLayer) => ({
  create: create(dal),
  delete: _delete(dal),
  list: list(dal),
  update: update(dal),
});
