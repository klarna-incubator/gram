import _ from "lodash";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { usePatchModelMutation } from "../api/gram/model";
import { PERMISSIONS } from "../components/model/constants";
import { useHasModelPermissions } from "./useHasModelPermissions";

function select(state) {
  const selection = {
    id: state.model.id,
    version: state.model.version,
    data: {
      components: _.cloneDeep(state.model.components),
      dataFlows: _.cloneDeep(state.model.dataFlows),
    },
    remote: state.model.remote,
  };
  return selection;
}

export function useModelSync() {
  const [patchModel] = usePatchModelMutation();
  // const store = useStore();
  const model = useSelector(select);
  const [previousValue, setPreviousValue] = useState(model);
  const writeAllowed = useHasModelPermissions(PERMISSIONS.WRITE);

  useEffect(() => {
    if (!writeAllowed || !model || !model.id || model.remote) return;
    if (!_.isEqual(previousValue, model)) {
      console.info("unequal values, trigger patch", model, previousValue);
      setPreviousValue(model);
      patchModel({ id: model.id, model });
    }
  }, [patchModel, previousValue, setPreviousValue, model, writeAllowed]);
}
