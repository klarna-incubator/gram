import { setMultipleSelected } from "./setSelected";

export const DELETE_NODES = "DELETE_NODES";

/**
 * Takes selected diagram nodes from the client and removes them.
 * This action calls the deleteNodes action which should sync remotely.
 * The selected items depend on the client.
 */
export const deleteSelected = () => (dispatch, getState) => {
  const {
    model: { selected },
  } = getState();

  dispatch(setMultipleSelected());
  dispatch(deleteNodes(Object.keys(selected)));
};

export const deleteNodes = (ids) => (dispatch) => {
  dispatch({
    type: DELETE_NODES,
    ids: [...ids],
  });
};
