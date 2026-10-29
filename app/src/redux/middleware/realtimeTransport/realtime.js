import { ADD_COMPONENT } from "../../../actions/model/addComponent";
import { ADD_DATA_FLOW } from "../../../actions/model/addDataFlow";
import { DELETE_NODES } from "../../../actions/model/deleteSelected";
import { MOVE_NODES } from "../../../actions/model/moveSelected";
import { PATCH_COMPONENT } from "../../../actions/model/patchComponent";
import { PATCH_DATA_FLOW } from "../../../actions/model/patchDataFlow";
import { PATCH_VERSION } from "../../../actions/model/patchVersion";
import { api } from "../../../api/gram/api";
import { PERMISSIONS } from "../../../components/model/constants";
import { realtimeActions } from "../../realtimeSlice";

/**
 * What the real-time middlewares (webSocket.js and sse.js) have in common:
 * which actions are shared with other clients, handling of what the server
 * sends, and the connection lifecycle. A transport only provides how to
 * connect, send and disconnect.
 */

// Temporary action const stored here. Fixed in later tickets
const REFETCH_RESOURCE = "REFETCH_RESOURCE";

let timeout;
const timeoutTime = 15000;

// Legacy
const whitelistedActionsToReflect = [
  ADD_COMPONENT,
  ADD_DATA_FLOW,
  DELETE_NODES,
  PATCH_COMPONENT,
  PATCH_DATA_FLOW,
  PATCH_VERSION,
  MOVE_NODES,

  // These are sent by the server, not clients
  REFETCH_RESOURCE,
];

// Move towards this structure as actions are converted to the new redux-toolkit format
const whitelistedActionsNew = [realtimeActions.activeUsers];

/**
 * Creates the redux middleware for a transport.
 *
 * @param transport.connect    (dispatch, modelId) => void
 * @param transport.send       (action) => void, sends a local edit to the others
 * @param transport.disconnect () => void
 */
export function createRealtimeMiddleware({ connect, send, disconnect }) {
  return ({ dispatch, getState }) =>
    (next) =>
    (action) => {
      if (realtimeActions.establishConnection.match(action)) {
        const modelId = action.payload;
        connect(dispatch, modelId);
      } else if (realtimeActions.disconnect.match(action)) {
        clearActivityTimeout();
        disconnect();
      }

      // Send redux actions out to the world
      if (
        whitelistedActionsToReflect.indexOf(action.type) > -1 &&
        !action.remote
      ) {
        const modelId = getState().model.id;
        const permissions =
          getState().api.queries[
            `getModelPermissions({"modelId":"${modelId}"})`
          ]; // wat
        if (
          getState().realtime.isConnected &&
          permissions?.data.includes(PERMISSIONS.WRITE)
        ) {
          send(action);
        }
      }

      next(action);
    };
}

// Call once the connection is usable.
export function onConnected(dispatch) {
  dispatch(realtimeActions.connectionEstablished());

  // How to get redux toolkit APIs to reload
  dispatch(
    api.util.invalidateTags([
      "Review",
      "Model",
      "Threats",
      "Controls",
      "Mitigations",
      "Suggestions",
      "ActionItems",
      "Flows",
      "Validation",
      "ResourceMatchings",
    ])
  );
}

// Handles a message from the server, given as the raw JSON string.
export function receive(dispatch, data, modelId) {
  resetTimeout(dispatch);
  const remoteEvent = { ...JSON.parse(data), remote: true };
  if (
    !remoteEvent.type ||
    (!whitelistedActionsToReflect.includes(remoteEvent.type) &&
      !whitelistedActionsNew.some((action) => action.match(remoteEvent)))
  ) {
    return;
  }

  if (remoteEvent.type === REFETCH_RESOURCE) {
    refetch(dispatch, remoteEvent, modelId);
  } else {
    dispatch(remoteEvent);
  }
}

function refetch(dispatch, event, modelId) {
  console.info("Got refetch event:", event);
  switch (event.what) {
    case "threats":
      dispatch(api.util.invalidateTags(["Threats"]));
      break;

    case "action-items":
      dispatch(api.util.invalidateTags(["ActionItems"]));
      break;

    case "controls":
      dispatch(api.util.invalidateTags(["Controls"]));
      break;

    case "mitigations":
      dispatch(api.util.invalidateTags(["Mitigations"]));
      break;

    case "review":
      dispatch(api.util.invalidateTags(["Review"]));
      break;

    case "suggestions":
      dispatch(api.util.invalidateTags(["Suggestions"]));
      break;

    case "validation":
      dispatch(api.util.invalidateTags(["Validation"]));
      break;

    case "links":
      dispatch(
        api.util.invalidateTags([
          {
            type: "Links",
            id: `${event.args.objectType}-${event.args.objectId}`,
          },
        ])
      );
      break;

    case "flows":
      dispatch(
        api.util.invalidateTags([
          {
            type: "Flows",
            id: `${event.args.modelId}-${event.args.dataFlowId}`,
          },
        ])
      );
      break;

    // case "model":
    //   dispatch(api.util.invalidateTags(["Model"]));
    //   break;
    case "resource-matchings":
      dispatch(api.util.invalidateTags(["ResourceMatchings"]));
      break;

    default:
      break;
  }
}

// Treats the connection as lost if nothing is received for a while.
export function resetTimeout(dispatch) {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    console.warn("Real-time connection timed out");
    dispatch(realtimeActions.disconnect());
  }, timeoutTime);
}

export function clearActivityTimeout() {
  if (timeout) clearTimeout(timeout);
}
