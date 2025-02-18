import { ADD_COMPONENT } from "../../actions/model/addComponent";
import { ADD_DATA_FLOW } from "../../actions/model/addDataFlow";
import { DELETE_NODES } from "../../actions/model/deleteSelected";
import { MOVE_NODES } from "../../actions/model/moveSelected";
import { PATCH_COMPONENT } from "../../actions/model/patchComponent";
import { PATCH_DATA_FLOW } from "../../actions/model/patchDataFlow";
import { PATCH_VERSION } from "../../actions/model/patchVersion";
import { api } from "../../api/gram/api";
import { getAuthToken } from "../../api/gram/util/authToken";
import { PERMISSIONS } from "../../components/model/constants";
import { webSocketActions } from "../webSocketSlice";

// Temporary action const stored here. Fixed in later tickets
const REFETCH_RESOURCE = "REFETCH_RESOURCE";

let socket;
let timeout;
let timeoutTime = 15000;

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
const whitelistedActionsNew = [webSocketActions.activeUsers];

export const webSocketMiddleware =
  ({ dispatch, getState }) =>
  (next) =>
  (action) => {
    if (webSocketActions.establishConnection.match(action)) {
      const modelId = action.payload;
      connect(dispatch, modelId); // Connect to API WS
    } else if (webSocketActions.disconnect.match(action)) {
      disconnect(); // Disconnect from API WS
    }

    // Send redux actions out to the world
    if (
      whitelistedActionsToReflect.indexOf(action.type) > -1 &&
      !action.remote
    ) {
      const modelId = getState().model.id;
      const permissions =
        getState().api.queries[`getModelPermissions({"modelId":"${modelId}"})`]; // wat
      if (
        getState().webSocket.isConnected &&
        permissions?.data.includes(PERMISSIONS.WRITE)
      ) {
        socket.send(JSON.stringify(action));
      }
    }

    next(action);
  };

function connect(dispatch, modelId) {
  if (socket) socket.close();

  socket = new WebSocket(
    `${document.location.protocol === "http:" ? "ws" : "wss"}://${
      document.location.host === "localhost:4726" &&
      process.env.NODE_ENV === "development"
        ? "localhost:8080" // hack as react doesnt seem to proxy the websocket correctly
        : document.location.host
    }/ws/model/${modelId}`,
    null,
    { headers: { Authorization: getAuthToken() } }
  );

  bind(dispatch, modelId);
  resetTimeout(dispatch);
}

function bind(dispatch, modelId) {
  socket.onopen = () => {
    const token = getAuthToken();
    // Send token to authenticate
    socket.send(JSON.stringify({ token }));

    dispatch(webSocketActions.connectionEstablished());

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
  };

  socket.onerror = (error) => {
    dispatch(webSocketActions.error(error));
    dispatch(webSocketActions.disconnect());
  };

  socket.onmessage = (event) => receive(dispatch, event, modelId);
}

function receive(dispatch, event, modelId) {
  resetTimeout(dispatch);
  const remoteEvent = { ...JSON.parse(event.data), remote: true };
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

function resetTimeout(dispatch) {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(() => {
    console.warn("Websocket timed out");
    dispatch(webSocketActions.disconnect());
  }, timeoutTime);
}

function disconnect() {
  if (timeout) clearTimeout(timeout);
  if (socket) socket.close();
}
