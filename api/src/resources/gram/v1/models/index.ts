import { ModelDataService } from "@gram/core/dist/data/models/ModelDataService.js";
import create from "./create.js";
import _delete from "./delete.js";
import get from "./get.js";
import templates from "./templates.js";
import list from "./list.js";
import patch from "./patch.js";
import permissions from "./permissions.js";
import setTemplate from "./setTemplate.js";

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
