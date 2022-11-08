import { DataAccessLayer } from "../../../../data/dal";
import { create } from "./create";
import { _delete } from "./delete";
import { list } from "./list";
import { update } from "./update";

export default (dal: DataAccessLayer) => ({
  list: list(dal),
  create: create(dal),
  delete: _delete(dal),
  update: update(dal),
});
