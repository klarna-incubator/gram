import { createSelector } from "@reduxjs/toolkit";
import _ from "lodash";
import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { usePatchModelMutation } from "../api/gram/model";
import { PERMISSIONS } from "../components/model/constants";
import { useHasModelPermissions } from "./useHasModelPermissions";

const selectModel = createSelector(
  (state) => state.model.id,
  (state) => state.model.version,
  (state) => state.model.components,
  (state) => state.model.dataFlows,
  (state) => state.model.remote,
  (id, version, components, dataFlows, remote) => ({
    id,
    version,
    components,
    dataFlows,
    remote,
  })
);

export function useModelSync() {
  const [patchModel] = usePatchModelMutation();
  const { id, version, components, dataFlows, remote } =
    useSelector(selectModel);
  const writeAllowed = useHasModelPermissions(PERMISSIONS.WRITE);

  // A ref rather than state: patching the model updates the store, which
  // re-renders this hook at sync priority. A state update scheduled from this
  // effect runs at a lower priority and would be starved by that re-render, so
  // the comparison below would keep seeing the pre-load snapshot and patch
  // forever.
  const lastSynced = useRef(null);

  useEffect(() => {
    if (!id) return;

    const data = { components, dataFlows };
    const previous = lastSynced.current;

    // A model we just loaded, one that arrived over the websocket, or one we
    // may not edit must be recorded but never sent back to the server.
    if (previous?.id !== id || remote || !writeAllowed) {
      lastSynced.current = { id, version, data };
      return;
    }

    if (previous.version === version && _.isEqual(previous.data, data)) return;

    lastSynced.current = { id, version, data };
    patchModel({ id, model: { id, version, data, remote } });
  }, [patchModel, id, version, components, dataFlows, remote, writeAllowed]);
}
