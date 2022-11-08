import { DataAccessLayer } from "../../../../data/dal";
import { MitigationDataService } from "../../../../data/mitigations/MitigationDataService";
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
