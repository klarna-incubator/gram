import { ModelDataService } from "@gram/core/dist/data/models/ModelDataService";
import create from "./create";
import _delete from "./delete";
import get from "./get";
import templates from "./templates";
import list from "./list";
import patch from "./patch";
import permissions from "./permissions";
import setTemplate from "./setTemplate";

export default (service: ModelDataService) => ({
  list: list(service),
  get: get(service),
  create: create(service),
  patch: patch(service),
  delete: _delete(service),
  permissions: permissions(service),
  templates: templates(service),
  setTemplate: setTemplate(service),
});
