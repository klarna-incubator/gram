import { ADD_DATA_FLOW } from "../actions/model/addDataFlow";
import { LOAD_MODEL } from "../actions/model/loadModel";
import modelReducer from "./model";

const dataFlow = {
  id: "0e4647df-23c8-4d6b-be0a-d1c2d1512f16",
  points: [0, 0, 100, 100],
  startComponent: { id: "949b3308-7d7e-4bdd-84d3-ed147edec355" },
  endComponent: { id: "4d46eafc-5fc2-48bc-b708-6bebd7a7014d" },
};

function loadedState() {
  return modelReducer(undefined, {
    type: LOAD_MODEL,
    model: {
      id: "bc5a8039-60ef-4eca-904e-21bd0e782d2d",
      version: "2021-09-23",
      data: { components: [], dataFlows: [] },
    },
  });
}

describe("modelReducer", () => {
  describe(ADD_DATA_FLOW, () => {
    it("appends the dataflow", () => {
      const state = modelReducer(loadedState(), {
        type: ADD_DATA_FLOW,
        dataFlow,
      });

      expect(state.dataFlows).toEqual([dataFlow]);
    });

    it("clears the remote flag for a locally added dataflow so it gets synced", () => {
      const loaded = loadedState();
      expect(loaded.remote).toBe(true);

      const state = modelReducer(loaded, { type: ADD_DATA_FLOW, dataFlow });

      expect(state.remote).toBe(false);
    });

    it("keeps the remote flag for a dataflow received over the websocket", () => {
      const state = modelReducer(loadedState(), {
        type: ADD_DATA_FLOW,
        dataFlow,
        remote: true,
      });

      expect(state.remote).toBe(true);
    });
  });
});
