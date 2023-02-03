import { DataAccessLayer } from "@gram/core/dist/data/dal";
import { create } from "./create";
import { _delete } from "./delete";
import { list } from "./list";

export function mitigationsV1(dal: DataAccessLayer) {
  return {
    list: list(dal),
    create: create(dal),
    delete: _delete(dal),
  };
}
