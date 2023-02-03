import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { create } from "./create";
import { _delete } from "./delete";
import { list } from "./list";
import { update } from "./update";

export default (dal: DataAccessLayer) => ({
  create: create(dal),
  delete: _delete(dal),
  list: list(dal),
  update: update(dal),
});
