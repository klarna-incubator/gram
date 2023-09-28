import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { create } from "./create.js";
import { _delete } from "./delete.js";
import { list } from "./list.js";
import { update } from "./update.js";

export default (dal: DataAccessLayer) => ({
  list: list(dal),
  create: create(dal),
  delete: _delete(dal),
  update: update(dal),
});
