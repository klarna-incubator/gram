// Shared by the real-time middleware specs.

jest.mock("../../../api/gram/util/authToken", () => ({
  getAuthToken: () => "test-token",
}));

export const MODEL_ID = "model-1";

export const flush = async () => {
  for (let i = 0; i < 10; i++) await Promise.resolve();
};

const loaded = [];

// Disconnects every middleware loaded by the test, so none keeps its connection
// or window listeners alive for the tests after it.
export function disconnectLoadedMiddlewares() {
  loaded.splice(0).forEach((disconnect) => disconnect());
}

// Loads a fresh middleware, as it keeps its connection in module state.
export function loadMiddleware(modulePath, exportName) {
  jest.resetModules();
  const middlewareModule = require(modulePath);
  const { realtimeActions } = require("../../realtimeSlice");
  const dispatch = jest.fn();
  const state = {
    model: { id: MODEL_ID },
    api: {
      queries: {
        [`getModelPermissions({"modelId":"${MODEL_ID}"})`]: {
          data: ["read", "write"],
        },
      },
    },
    realtime: { isConnected: true },
  };
  const next = jest.fn();
  const middleware = middlewareModule[exportName]({
    dispatch,
    getState: () => state,
  })(next);
  loaded.push(() => middleware(realtimeActions.disconnect()));
  return { middleware, realtimeActions, dispatch, state, next };
}

export const dispatched = (dispatch) =>
  dispatch.mock.calls.map(([action]) => action);

export const dispatchedTypes = (dispatch) =>
  dispatched(dispatch).map((a) => a.type);
