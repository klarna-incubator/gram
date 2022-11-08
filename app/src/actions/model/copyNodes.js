import { v4 as uuidv4 } from "uuid";
import { api } from "../../api/gram/api";
import { addComponent } from "./addComponent";
import { addDataFlow } from "./addDataFlow";
import { setMultipleSelected } from "./setSelected";

export const copyNodes = (componentIds) => async (dispatch, getState) => {
  const state = getState();

  const model = state.model;
  const modelId = model.id;

  const { data: threats } = api.endpoints.listThreats.select({
    modelId,
  })(state);

  const { data: controls } = api.endpoints.listControls.select({
    modelId,
  })(state);

  const { data: mitigations } = api.endpoints.listMitigations.select({
    modelId,
  })(state);

  const ids = new Set(componentIds);
  const idMap = new Map();

  // Copy components
  model.components
    .filter((c) => ids.has(c.id))
    .forEach((c) => {
      const newId = uuidv4();
      idMap.set(c.id, newId);
      dispatch(
        addComponent(
          {
            ...c,
            x: c.x + 10,
            y: c.y + 10,
          },
          newId
        )
      );
    });

  // Copy data flows
  model.dataFlows
    .filter((df) => ids.has(df.id))
    .forEach((df) => {
      const newId = uuidv4();
      idMap.set(df.id, newId);
      dispatch(
        addDataFlow({
          ...df,
          endComponent: {
            id: idMap.has(df.endComponent.id)
              ? idMap.get(df.endComponent.id)
              : df.endComponent.id,
          },
          startComponent: {
            id: idMap.has(df.startComponent.id)
              ? idMap.get(df.startComponent.id)
              : df.startComponent.id,
          },
          points: df.points.map((p) => p + 10),
          id: newId,
        })
      );
    });

  dispatch(setMultipleSelected([...idMap.values()]));

  for (const oldComponentId of componentIds) {
    const newComponentId = idMap.get(oldComponentId);

    //copy threats
    const copyThreats = async () => {
      await Promise.all(
        threats?.threats[oldComponentId].map(async (oldThreatData) => {
          const result = await dispatch(
            api.endpoints.createThreat.initiate({
              modelId: oldThreatData.modelId,
              threat: {
                componentId: newComponentId,
                description: oldThreatData.description,
                title: oldThreatData.title,
              },
            })
          );

          if (result?.data?.threat?.id) {
            idMap.set(oldThreatData.id, result.data.threat.id);
          }
        })
      );
    };

    const copyControls = async () =>
      await Promise.all(
        controls?.controls[oldComponentId].map(async (oldControlData) => {
          const result = await dispatch(
            api.endpoints.createControl.initiate({
              modelId: oldControlData.modelId,
              control: {
                componentId: newComponentId,
                description: oldControlData.description,
                title: oldControlData.title,
                inPlace: oldControlData.inPlace,
              },
            })
          );

          if (result?.data?.control?.id) {
            idMap.set(oldControlData.id, result.data.control.id);
          }
        })
      );

    await Promise.all([copyThreats(), copyControls()]);

    const oldThreats = new Set(
      threats?.threats[oldComponentId].map((t) => t.id)
    );

    //link mitigations
    await Promise.all(
      mitigations?.mitigations
        .filter((m) => oldThreats.has(m.threatId))
        .map(async (m) => {
          const threatId = idMap.get(m.threatId);
          const controlId = idMap.get(m.controlId);
          return dispatch(
            api.endpoints.createMitigation.initiate({
              modelId,
              threatId,
              controlId,
            })
          );
        })
    );
  }
};
