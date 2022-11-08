export const MOVE_NODES = "MOVE_NODES";

export const moveComponents = (components) => (dispatch) => {
  dispatch({
    type: MOVE_NODES,
    components: components,
  });
};

export const moveSelected = (vector) => (dispatch, getState) => {
  const {
    model: { selected },
  } = getState();

  dispatch(moveNodes(vector, selected));
};

export const moveNodes = (vector, nodes) => (dispatch) => {
  dispatch({
    type: MOVE_NODES,
    vector,
    nodes: [...nodes],
  });
};
