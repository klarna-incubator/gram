import { MODEL_CLEAR_REDUX_STATE } from "../actions/model.action";
import { ADD_COMPONENT } from "../actions/model/addComponent";
import { ADD_DATA_FLOW } from "../actions/model/addDataFlow";
import {
  CHANGE_CURSOR_TYPE,
  CURSOR_POINTER,
} from "../actions/model/controlsToolbarActions";
import { DELETE_NODES } from "../actions/model/deleteSelected";
import { LOAD_MODEL } from "../actions/model/loadModel";
import { MOVE_NODES } from "../actions/model/moveSelected";
import { PATCH_COMPONENT } from "../actions/model/patchComponent";
import { PATCH_DATA_FLOW } from "../actions/model/patchDataFlow";
import { PATCH_VERSION } from "../actions/model/patchVersion";
import {
  SET_MULTIPLE_SELECTED,
  SET_SELECTED,
} from "../actions/model/setSelected";
import {
  TOGGLE_LEFT_PANEL,
  TOGGLE_RIGHT_PANEL,
} from "../actions/model/togglePanel";
import { closestMagnets, getMagnets } from "../components/model/board/util";

export const initialFormState = {
  show: false,
  id: null,
  value: "",
  x: null,
  y: null,
};

const initialState = {
  pending: true,
  error: null,
  components: [],
  dataFlows: [],
  // The nodes/flows that are currently selected.
  selected: {},
  deleted: false,
  remote: false,
  componentForm: initialFormState,
  rightPanelCollapsed: false,
  leftPanelCollapsed: false,
  cursorType: CURSOR_POINTER,
};

let selected;
function getSelectedDataFlows(selected, dataFlows) {
  selected = {
    ...selected,
    ...dataFlows
      .filter(
        (df) =>
          df.startComponent.id in selected && df.endComponent.id in selected
      )
      .reduce((a, df) => ({ ...a, [df.id]: true }), {}),
  };
  return selected;
}

// This reducer always triggers a patch call to the API
const mutatorReducer = (state = initialState, action) => {
  let i;
  switch (action.type) {
    // Remote syncing actions
    case ADD_COMPONENT:
      return {
        ...state,
        components: [...state.components, action.component],
        componentForm: initialFormState,
        remote: !!action.remote,
      };

    case ADD_DATA_FLOW:
      return { ...state, dataFlows: [...state.dataFlows, action.dataFlow] };

    case MOVE_NODES:
      const movedComponentsState = state.components.map((c) => {
        const movedComponent = action.components.find((ac) => ac.id === c.id);
        if (movedComponent) {
          return { ...c, ...movedComponent };
        }
        return { ...c };
      });

      return {
        ...state,
        components: movedComponentsState,
        remote: !!action.remote,
      };

    case PATCH_COMPONENT:
      i = state.components.findIndex((c) => c.id === action.id);
      const editedComponent = { ...state.components[i], ...action.fields };
      return {
        ...state,
        components: [
          ...state.components.slice(0, i),
          editedComponent,
          ...state.components.slice(i + 1),
        ],
        remote: !!action.remote,
      };

    case PATCH_DATA_FLOW:
      i = state.dataFlows.findIndex((d) => d.id === action.id);
      const editedDataflow = { ...state.dataFlows[i], ...action.fields };

      // If label was just set, set it to the first anchor
      if (
        editedDataflow.label !== "" &&
        (editedDataflow.labelAnchor === -1 ||
          editedDataflow.labelAnchor === undefined)
      ) {
        // If there are no anchors and the label was just set, add a new one for the label.
        if (editedDataflow.points.length === 4) {
          const startComponent = state.components.find(
            (c) => c.id === editedDataflow.startComponent.id
          );
          const endComponent = state.components.find(
            (c) => c.id === editedDataflow.endComponent.id
          );
          const startMagnets = getMagnets([startComponent.x, startComponent.y]); //editedDataflow.points.slice(0, 2));
          const endMagnets = getMagnets([endComponent.x, endComponent.y]);
          const magnets = closestMagnets(startMagnets, endMagnets, []);

          editedDataflow.points = [
            ...editedDataflow.points.slice(0, 2), // Might be better to set these as: startComponent.x, startComponent.y
            (magnets[0] + magnets[2]) / 2,
            (magnets[1] + magnets[3]) / 2,
            ...editedDataflow.points.slice(2),
          ];
        }
        // ... set it to the first anchor
        editedDataflow.labelAnchor = 2;
      }
      // If there is an anchor and the label was just removed, remove the anchor.
      else if (
        editedDataflow.label === "" &&
        editedDataflow.labelAnchor !== -1
      ) {
        // Delete anchor by removing points.
        editedDataflow.points = [
          ...editedDataflow.points.slice(0, editedDataflow.labelAnchor),
          ...editedDataflow.points.slice(editedDataflow.labelAnchor + 2),
        ];
        editedDataflow.labelAnchor = -1;
      }
      return {
        ...state,
        dataFlows: [
          ...state.dataFlows.slice(0, i),
          editedDataflow,
          ...state.dataFlows.slice(i + 1),
        ],
        remote: !!action.remote,
      };

    case PATCH_VERSION:
      return {
        ...state,
        version: action.version,
        remote: !!action.remote,
      };

    case DELETE_NODES:
      const deletedIds = new Set(action.ids);
      return {
        ...state,
        dataFlows: state.dataFlows.filter(
          (d) =>
            !deletedIds.has(d.id) &&
            // Catch any orphaned dataflows. No single parents allowed.
            !deletedIds.has(d.endComponent.id) &&
            !deletedIds.has(d.startComponent.id)
        ),
        components: state.components.filter((c) => !deletedIds.has(c.id)),
        remote: !!action.remote,
      };

    case LOAD_MODEL:
      const { components, dataFlows } = action.model.data;
      return {
        ...state,
        ...action.model,
        components,
        dataFlows,
        remote: true,
      };

    default:
      return;
  }
};

const localReducer = (state = initialState, action) => {
  switch (action.type) {
    // Local only state actions
    case MODEL_CLEAR_REDUX_STATE:
      return { ...initialState };
    case SET_SELECTED:
      selected = { ...state.selected };
      if (action.value) {
        selected[action.id] = true;
      } else {
        delete selected[action.id];
      }
      selected = getSelectedDataFlows(selected, state.dataFlows);
      return { ...state, selected: selected };
    case SET_MULTIPLE_SELECTED:
      selected = action.ids.reduce((a, id) => ({ ...a, [id]: true }), {});
      selected = getSelectedDataFlows(selected, state.dataFlows);
      return { ...state, selected: selected };
    case TOGGLE_RIGHT_PANEL:
      return { ...state, rightPanelCollapsed: action.value };
    case TOGGLE_LEFT_PANEL:
      return { ...state, leftPanelCollapsed: action.value };
    case CHANGE_CURSOR_TYPE:
      return { ...state, cursorType: action.value };
    default:
      return state;
  }
};

export default function modelReducer(state = initialState, action) {
  let res = mutatorReducer(state, action);
  if (!res) {
    res = localReducer(state, action);
  }
  return res;
}
