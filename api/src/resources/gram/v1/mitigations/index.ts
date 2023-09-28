import { DataAccessLayer } from "@gram/core/dist/data/dal.js";
import { create } from "./create.js";
import { _delete } from "./delete.js";
import { list } from "./list.js";

export function mitigationsV1(dal: DataAccessLayer) {
  return {
    list: list(dal),
    create: create(dal),
    delete: _delete(dal),
  };
}
